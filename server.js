import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { createDatabasePool } from "./database/pool.js";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  randomUUID
} from "node:crypto";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const scrypt = promisify(scryptCallback);
const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
const adminCookieName = "phonex_admin_session";
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const productUploadsDirectory = path.join(root, "images", "uploads");
const productImageTypes = new Map([
  ["image/jpeg", { extension: "jpg", signature: bytes => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ["image/png", { extension: "png", signature: bytes => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) }],
  ["image/webp", { extension: "webp", signature: bytes => bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" }]
]);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.");
}

const pool = createDatabasePool(databaseUrl, { idleTimeoutMillis: 30000, max: 10 });

pool.on("error", error => {
  console.error("Unexpected PostgreSQL pool error.", error);
});

app.disable("x-powered-by");
app.set("trust proxy", isProduction ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(cookieParser());
app.use(express.json({ limit: "32kb", strict: true }));
app.use("/api", rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait and try again." }
});

const productQuerySchema = z.object({
  category: z.enum(["phones", "audio", "watches"]).optional(),
  search: z.string().trim().max(100).optional()
}).strict();
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256)
}).strict();
const orderSchema = z.object({
  expectedTotalMad: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  customer: z.object({
    fullName: z.string().trim().min(2).max(160),
    phone: z.string().trim().min(7).max(32),
    city: z.string().trim().min(1).max(120),
    address: z.string().trim().min(3).max(500),
    notes: z.string().trim().max(1000).default("")
  }).strict(),
  items: z.array(z.object({
    productId: z.string().trim().min(1).max(100),
    quantity: z.number().int().min(1).max(99)
  }).strict()).min(1).max(50)
}).strict();
const orderReceiptSchema = z.object({
  receiptToken: z.string().min(40).max(100)
}).strict();
const orderStatusSchema = z.object({
  status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled"])
}).strict();
const adminProductSchema = z.object({
  id: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(180),
  category: z.enum(["phones", "audio", "watches"]),
  categoryName: z.string().trim().min(1).max(100),
  specification: z.string().trim().max(500).default(""),
  originalPriceMad: z.number().int().min(1).max(10_000_000),
  salePriceMad: z.number().int().min(1).max(10_000_000).nullable(),
  tag: z.string().trim().max(100).default(""),
  imageUrl: z.union([
    z.string().url().max(2000).refine(value => value.startsWith("https://images.unsplash.com/")),
    z.string().max(2000).refine(value => value.startsWith("/images/") && !value.startsWith("//")),
    z.literal("")
  ]).default(""),
  stockOnHand: z.number().int().min(0).max(1_000_000),
  priceVerified: z.boolean(),
  inventoryVerified: z.boolean(),
  isActive: z.boolean()
}).strict().superRefine((product, context) => {
  if (product.salePriceMad !== null && product.salePriceMad >= product.originalPriceMad) {
    context.addIssue({ code: "custom", path: ["salePriceMad"], message: "The sale price must be lower than the original price." });
  }
  if (product.priceVerified && product.originalPriceMad < 1) {
    context.addIssue({ code: "custom", path: ["originalPriceMad"], message: "Verified prices must be greater than zero." });
  }
});

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function constantTimeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function setSessionCookie(response, token, maxAge) {
  response.cookie(adminCookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge
  });
}

function clearSessionCookie(response) {
  response.clearCookie(adminCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/"
  });
}

async function verifyAdminPassword(password) {
  if (!adminPasswordHash) return false;
  const parts = adminPasswordHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  let salt;
  let expected;
  try {
    salt = Buffer.from(parts[1], "base64url");
    expected = Buffer.from(parts[2], "base64url");
  } catch {
    return false;
  }
  if (salt.length < 16 || expected.length !== 64) return false;
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(actual, expected);
}

async function requireAdmin(request, response, next) {
  const token = request.cookies?.[adminCookieName];
  if (!token || token.length > 200) {
    response.status(401).json({ error: "Admin sign-in required." });
    return;
  }
  try {
    const result = await pool.query(
      "SELECT session_hash, csrf_hash FROM admin_sessions WHERE session_hash = $1 AND expires_at > now()",
      [hashToken(token)]
    );
    if (!result.rowCount) {
      clearSessionCookie(response);
      response.status(401).json({ error: "Admin session expired. Sign in again." });
      return;
    }
    request.adminSession = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

function requireCsrf(request, response, next) {
  const token = request.get("x-csrf-token");
  if (typeof token !== "string" || !constantTimeStringEqual(hashToken(token), request.adminSession.csrf_hash)) {
    response.status(403).json({ error: "Invalid request token. Refresh the admin page and try again." });
    return;
  }
  next();
}

app.get("/api/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed.", error);
    response.status(503).json({ status: "unavailable", database: "disconnected" });
  }
});

app.get("/api/products", async (request, response, next) => {
  const parsed = productQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid product filters." });
    return;
  }

  const { category, search } = parsed.data;
  const values = [];
  const conditions = [
    "is_active = TRUE",
    "price_verified = TRUE",
    "price_mad > 0",
    "inventory_verified = TRUE",
    "stock_on_hand IS NOT NULL"
  ];
  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (search) {
    values.push(`%${search.replace(/[\\%_]/g, "\\$&")}%`);
    conditions.push(`(name ILIKE $${values.length} ESCAPE '\\' OR specification ILIKE $${values.length} ESCAPE '\\')`);
  }

  try {
    const result = await pool.query(
      `SELECT id, name, category, category_name, specification, price_mad,
              original_price_mad, tag, image_url,
              stock_on_hand
       FROM products
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at, name
       LIMIT 200`,
      values
    );
    response.set("Cache-Control", "no-store");
    response.json({ products: result.rows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (request, response, next) => {
  const parsed = orderSchema.safeParse(request.body);
  const idempotencyKey = request.get("idempotency-key");
  const receipt = orderReceiptSchema.safeParse({ receiptToken: request.get("x-order-receipt") });
  if (!parsed.success || !z.string().uuid().safeParse(idempotencyKey).success || !receipt.success) {
    response.status(400).json({ error: "Valid customer, items, Idempotency-Key, and receipt token are required." });
    return;
  }

  const quantities = new Map();
  parsed.data.items.forEach(item => {
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  });
  if ([...quantities.values()].some(quantity => quantity > 99)) {
    response.status(400).json({ error: "A product quantity cannot exceed 99." });
    return;
  }

  const client = await pool.connect().catch(next);
  if (!client) return;
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      `SELECT o.id, o.status, o.total_mad, o.created_at
       FROM orders o WHERE o.idempotency_key = $1`,
      [idempotencyKey]
    );
    if (existing.rowCount) {
      await client.query("COMMIT");
      response.status(200).json({ order: existing.rows[0], duplicate: true });
      return;
    }

    const ids = [...quantities.keys()].sort();
    const productResult = await client.query(
      `SELECT id, name, price_mad, stock_on_hand
       FROM products
       WHERE id = ANY($1::text[]) AND is_active = TRUE AND price_verified = TRUE
         AND price_mad > 0 AND inventory_verified = TRUE AND stock_on_hand > 0
       ORDER BY id
       FOR UPDATE`,
      [ids]
    );
    if (productResult.rowCount !== ids.length) {
      await client.query("ROLLBACK");
      response.status(409).json({ error: "تعذر إتمام الطلب: منتج واحد أو أكثر لم يعد متاحاً أو لم يتم تأكيده. حدّث المنتجات وراجع السلة." });
      return;
    }

    const lockedProducts = new Map(productResult.rows.map(product => [product.id, product]));
    const orderItems = ids.map(productId => {
      const product = lockedProducts.get(productId);
      const quantity = quantities.get(productId);
      if (product.stock_on_hand < quantity) return null;
      return {
        product,
        quantity,
        lineTotal: Number(product.price_mad) * quantity
      };
    });
    if (orderItems.some(item => item === null)) {
      await client.query("ROLLBACK");
      response.status(409).json({ error: "الكمية المطلوبة أكبر من المخزون المتاح. حدّث الصفحة وراجع الكمية." });
      return;
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    if (!Number.isSafeInteger(subtotal)) {
      await client.query("ROLLBACK");
      response.status(400).json({ error: "Order total exceeds the supported amount." });
      return;
    }
    if (subtotal !== parsed.data.expectedTotalMad) {
      await client.query("ROLLBACK");
      response.status(409).json({ error: "تغير ثمن منتج منذ فتح الصفحة. حدّث المنتجات وراجع المجموع قبل تأكيد الطلب." });
      return;
    }

    const customer = parsed.data.customer;
    const customerResult = await client.query(
      `INSERT INTO customers (full_name, phone, city, address)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [customer.fullName, customer.phone, customer.city, customer.address]
    );
    const orderId = randomUUID();
    const receiptToken = receipt.data.receiptToken;
    const orderResult = await client.query(
      `INSERT INTO orders
         (id, customer_id, subtotal_mad, total_mad, customer_notes, idempotency_key, receipt_token_hash)
       VALUES ($1, $2, $3, $3, $4, $5, $6)
       RETURNING id, status, total_mad, created_at`,
      [orderId, customerResult.rows[0].id, subtotal, customer.notes, idempotencyKey, hashToken(receiptToken)]
    );

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_mad, line_total_mad)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.product.id, item.product.name, item.quantity, item.product.price_mad, item.lineTotal]
      );
      await client.query(
        "UPDATE products SET stock_on_hand = stock_on_hand - $2, updated_at = now() WHERE id = $1",
        [item.product.id, item.quantity]
      );
    }

    await client.query("COMMIT");
    response.status(201).json({ order: orderResult.rows[0], receiptToken });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Order rollback failed.", rollbackError);
    }
    if (error.code === "23505" && error.constraint === "orders_idempotency_key_key") {
      try {
        const duplicate = await pool.query(
          "SELECT id, status, total_mad, created_at FROM orders WHERE idempotency_key = $1",
          [idempotencyKey]
        );
        if (duplicate.rowCount) {
          response.status(200).json({ order: duplicate.rows[0], duplicate: true });
          return;
        }
      } catch (lookupError) {
        next(lookupError);
        return;
      }
    }
    next(error);
  } finally {
    client.release();
  }
});

app.get("/api/orders/:id", async (request, response, next) => {
  const id = z.string().uuid().safeParse(request.params.id);
  const parsed = orderReceiptSchema.safeParse({ receiptToken: request.get("x-order-receipt") });
  if (!id.success || !parsed.success) {
    response.status(404).json({ error: "Order receipt not found." });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT o.id, o.status, o.total_mad, o.created_at,
              COALESCE(items.products, '[]'::json) AS products
       FROM orders o
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'productId', oi.product_id, 'name', oi.product_name,
           'quantity', oi.quantity, 'unitPrice', oi.unit_price_mad,
           'lineTotal', oi.line_total_mad
         ) ORDER BY oi.id) AS products
         FROM order_items oi WHERE oi.order_id = o.id
       ) items ON TRUE
       WHERE o.id = $1 AND o.receipt_token_hash = $2`,
      [id.data, hashToken(parsed.data.receiptToken)]
    );
    if (!result.rowCount) {
      response.status(404).json({ error: "Order receipt not found." });
      return;
    }
    response.set("Cache-Control", "no-store");
    response.json({ order: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", adminLoginLimiter, async (request, response, next) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter a valid email address and password." });
    return;
  }
  if (!adminEmail || !adminPasswordHash) {
    response.status(503).json({ error: "Admin sign-in has not been configured on this server." });
    return;
  }

  try {
    const valid = constantTimeStringEqual(parsed.data.email.toLowerCase(), adminEmail) &&
      await verifyAdminPassword(parsed.data.password);
    if (!valid) {
      response.status(401).json({ error: "Email or password is incorrect." });
      return;
    }

    const sessionToken = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(32).toString("base64url");
    await pool.query("DELETE FROM admin_sessions WHERE expires_at <= now()");
    await pool.query(
      `INSERT INTO admin_sessions (session_hash, csrf_hash, expires_at)
       VALUES ($1, $2, now() + interval '8 hours')`,
      [hashToken(sessionToken), hashToken(csrfToken)]
    );
    setSessionCookie(response, sessionToken, sessionLifetimeMs);
    response.set("Cache-Control", "no-store");
    response.json({ authenticated: true, csrfToken, email: adminEmail });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/session", requireAdmin, async (request, response, next) => {
  try {
    const csrfToken = randomBytes(32).toString("base64url");
    await pool.query(
      "UPDATE admin_sessions SET csrf_hash = $2 WHERE session_hash = $1",
      [request.adminSession.session_hash, hashToken(csrfToken)]
    );
    response.set("Cache-Control", "no-store");
    response.json({ authenticated: true, csrfToken, email: adminEmail });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/logout", requireAdmin, requireCsrf, async (request, response, next) => {
  try {
    await pool.query("DELETE FROM admin_sessions WHERE session_hash = $1", [request.adminSession.session_hash]);
    clearSessionCookie(response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/products", requireAdmin, async (_request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, category_name, specification, price_mad,
              original_price_mad, sale_price_mad, tag, image_url,
              stock_on_hand, price_verified, inventory_verified, is_active, updated_at
       FROM products
       ORDER BY name, id`
    );
    response.set("Cache-Control", "no-store");
    response.json({ products: result.rows });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/admin/products/image",
  requireAdmin,
  requireCsrf,
  express.raw({ type: [...productImageTypes.keys()], limit: "5mb" }),
  async (request, response, next) => {
    const contentType = request.get("content-type")?.split(";")[0].trim().toLowerCase();
    const imageType = productImageTypes.get(contentType);
    if (!imageType || !Buffer.isBuffer(request.body) || !imageType.signature(request.body)) {
      response.status(415).json({ error: "ارفع صورة JPEG أو PNG أو WebP صالحة." });
      return;
    }

    try {
      await mkdir(productUploadsDirectory, { recursive: true });
      const filename = `${randomUUID()}.${imageType.extension}`;
      await writeFile(path.join(productUploadsDirectory, filename), request.body, { flag: "wx" });
      response.status(201).json({ imageUrl: `/images/uploads/${filename}` });
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/admin/products", requireAdmin, requireCsrf, async (request, response, next) => {
  const parsed = adminProductSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "بيانات المنتج غير صالحة. راجع الاسم والثمن والمخزون والتصنيفات." });
    return;
  }
  const product = parsed.data;
  const priceMad = product.salePriceMad ?? product.originalPriceMad;
  try {
    const result = await pool.query(
      `INSERT INTO products
         (id, name, category, category_name, specification, price_mad,
          original_price_mad, sale_price_mad, tag, image_url,
          stock_on_hand, price_verified, inventory_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULLIF($10, ''), $11, $12, $13, $14)
       RETURNING id, name, category, category_name, specification, price_mad,
                 original_price_mad, sale_price_mad, tag, image_url,
                 stock_on_hand, price_verified, inventory_verified, is_active, updated_at`,
      [
        product.id, product.name, product.category, product.categoryName, product.specification,
        priceMad, product.originalPriceMad, product.salePriceMad, product.tag, product.imageUrl, product.stockOnHand,
        product.priceVerified, product.inventoryVerified,
        product.isActive && product.priceVerified && product.inventoryVerified && product.stockOnHand !== null
      ]
    );
    response.status(201).json({ product: result.rows[0] });
  } catch (error) {
    if (error.code === "23505" && error.constraint === "products_pkey") {
      response.status(409).json({ error: "معرّف هذا المنتج مستعمل. اختر معرّفاً آخر." });
      return;
    }
    if (error.code === "23505" && error.constraint === "products_name_category_name_key") {
      response.status(409).json({ error: "هذا المنتج مسجل من قبل لهذه الماركة." });
      return;
    }
    next(error);
  }
});

app.delete("/api/admin/products/:id", requireAdmin, requireCsrf, async (request, response, next) => {
  const id = z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(request.params.id);
  if (!id.success) {
    response.status(400).json({ error: "معرّف المنتج غير صالح." });
    return;
  }
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id.data]);
    if (!result.rowCount) {
      response.status(404).json({ error: "المنتج غير موجود." });
      return;
    }
    response.status(204).end();
  } catch (error) {
    if (error.code === "23503" && error.constraint === "order_items_product_id_fkey") {
      response.status(409).json({ error: "لا يمكن حذف منتج مرتبط بطلبات سابقة. يمكنك إخفاؤه بدلاً من ذلك." });
      return;
    }
    next(error);
  }
});

app.put("/api/admin/products/:id", requireAdmin, requireCsrf, async (request, response, next) => {
  const id = z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(request.params.id);
  const parsed = adminProductSchema.safeParse(request.body);
  if (!id.success || !parsed.success || parsed.data.id !== id.data) {
    response.status(400).json({ error: "بيانات المنتج أو المعرّف غير صالحة." });
    return;
  }
  const product = parsed.data;
  const priceMad = product.salePriceMad ?? product.originalPriceMad;
  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $2, category = $3, category_name = $4, specification = $5,
           price_mad = $6, original_price_mad = $7, sale_price_mad = $8,
           tag = $9, image_url = NULLIF($10, ''), stock_on_hand = $11,
           price_verified = $12, inventory_verified = $13,
           is_active = ($14 AND $12 AND $13 AND $11 IS NOT NULL), updated_at = now()
       WHERE id = $1
       RETURNING id, name, category, category_name, specification, price_mad,
                 original_price_mad, sale_price_mad, tag, image_url,
                 stock_on_hand, price_verified, inventory_verified, is_active, updated_at`,
      [
        product.id, product.name, product.category, product.categoryName, product.specification,
        priceMad, product.originalPriceMad, product.salePriceMad, product.tag, product.imageUrl,
        product.stockOnHand, product.priceVerified, product.inventoryVerified, product.isActive
      ]
    );
    if (!result.rowCount) {
      response.status(404).json({ error: "المنتج غير موجود." });
      return;
    }
    response.json({ product: result.rows[0] });
  } catch (error) {
    if (error.code === "23505" && error.constraint === "products_name_category_name_key") {
      response.status(409).json({ error: "هذا المنتج مسجل من قبل لهذه الماركة." });
      return;
    }
    next(error);
  }
});

app.get("/api/admin/orders", requireAdmin, async (request, response, next) => {
  const parsed = z.object({
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100_000).default(0)
  }).strict().safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid order filters." });
    return;
  }
  const values = [];
  const conditions = [];
  if (parsed.data.status) {
    values.push(parsed.data.status);
    conditions.push(`o.status = $${values.length}`);
  }
  values.push(parsed.data.limit, parsed.data.offset);
  try {
    const result = await pool.query(
      `SELECT o.id, o.status, o.payment_method, o.payment_status, o.subtotal_mad,
              o.delivery_fee_mad, o.total_mad, o.customer_notes, o.created_at,
              c.full_name, c.phone, c.city, c.address,
              COALESCE(items.products, '[]'::json) AS products
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object(
           'productId', oi.product_id, 'name', oi.product_name,
           'quantity', oi.quantity, 'unitPrice', oi.unit_price_mad,
           'lineTotal', oi.line_total_mad
         ) ORDER BY oi.id) AS products
         FROM order_items oi WHERE oi.order_id = o.id
       ) items ON TRUE
       ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY o.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    response.set("Cache-Control", "no-store");
    response.json({ orders: result.rows, limit: parsed.data.limit, offset: parsed.data.offset });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/orders/:id", requireAdmin, requireCsrf, async (request, response, next) => {
  const id = z.string().uuid().safeParse(request.params.id);
  const parsed = orderStatusSchema.safeParse(request.body);
  if (!id.success || !parsed.success) {
    response.status(400).json({ error: "A valid order ID and status are required." });
    return;
  }
  const transitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
  };
  const client = await pool.connect().catch(next);
  if (!client) return;
  try {
    await client.query("BEGIN");
    const current = await client.query(
      "SELECT id, status FROM orders WHERE id = $1 FOR UPDATE",
      [id.data]
    );
    if (!current.rowCount) {
      await client.query("ROLLBACK");
      response.status(404).json({ error: "Order not found." });
      return;
    }
    if (!transitions[current.rows[0].status]?.includes(parsed.data.status)) {
      await client.query("ROLLBACK");
      response.status(409).json({ error: "This order status transition is not allowed." });
      return;
    }
    if (parsed.data.status === "cancelled") {
      await client.query(
        `UPDATE products p
         SET stock_on_hand = p.stock_on_hand + oi.quantity, updated_at = now()
         FROM order_items oi
         WHERE oi.order_id = $1 AND p.id = oi.product_id AND p.inventory_verified = TRUE`,
        [id.data]
      );
    }
    const result = await client.query(
      `UPDATE orders SET status = $2, updated_at = now()
       WHERE id = $1 RETURNING id, status, total_mad, updated_at`,
      [id.data, parsed.data.status]
    );
    await client.query("COMMIT");
    response.json({ order: result.rows[0] });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Order status rollback failed.", rollbackError);
    }
    next(error);
  } finally {
    client.release();
  }
});

const frontendPages = new Set([
  "index.html", "products.html", "product.html", "about.html",
  "contact.html", "checkout.html", "order-success.html", "admin-dashboard.html"
]);
app.get("/", (_request, response) => response.sendFile(path.join(root, "index.html")));
app.get("/index.css", (_request, response) => response.sendFile(path.join(root, "index.css")));
app.get("/index.js", (_request, response) => response.sendFile(path.join(root, "index.js")));
app.get("/admin-dashboard.js", (_request, response) => response.sendFile(path.join(root, "admin-dashboard.js")));
app.get("/admin.html", (_request, response) => response.redirect(308, "/admin-dashboard.html"));
app.get("/:page", (request, response, next) => {
  if (!frontendPages.has(request.params.page)) {
    response.status(404).send("Not found");
    return;
  }
  response.sendFile(path.join(root, request.params.page), error => {
    if (error) next(error);
  });
});
app.use("/images", express.static(path.join(root, "images"), {
  dotfiles: "deny",
  fallthrough: false,
  immutable: true,
  maxAge: "7d"
}));

app.use((error, _request, response, _next) => {
  if (response.headersSent) return;
  if (error?.type === "entity.parse.failed") {
    response.status(400).json({ error: "Invalid JSON request body." });
    return;
  }
  if (error?.status === 413) {
    response.status(413).json({ error: "حجم الصورة يتجاوز الحد المسموح (5MB)." });
    return;
  }
  if (error?.status === 404) {
    response.status(404).json({ error: "Resource not found." });
    return;
  }
  console.error("Unhandled request error.", error);
  response.status(500).json({ error: "An unexpected server error occurred." });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`PhoneX server listening on port ${port}.`);
});

function shutdown(signal) {
  console.log(`${signal} received; closing PhoneX server.`);
  server.close(error => {
    if (error) {
      console.error("HTTP server shutdown failed.", error);
      process.exitCode = 1;
    }
    pool.end().catch(poolError => {
      console.error("PostgreSQL pool shutdown failed.", poolError);
      process.exitCode = 1;
    });
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

export { app, pool };
