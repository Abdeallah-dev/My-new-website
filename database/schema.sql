CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 180),
  category TEXT NOT NULL CHECK (category IN ('phones', 'audio', 'watches')),
  category_name TEXT NOT NULL,
  specification TEXT NOT NULL DEFAULT '',
  price_mad INTEGER NOT NULL CHECK (price_mad >= 0),
  original_price_mad INTEGER NOT NULL CONSTRAINT products_original_price_mad_check CHECK (original_price_mad > 0),
  sale_price_mad INTEGER CHECK (sale_price_mad IS NULL OR sale_price_mad > 0),
  tag TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  stock_on_hand INTEGER CHECK (stock_on_hand IS NULL OR stock_on_hand >= 0),
  price_verified BOOLEAN NOT NULL DEFAULT FALSE,
  inventory_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price_mad INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_mad INTEGER;
UPDATE products SET original_price_mad = GREATEST(price_mad, 1) WHERE original_price_mad IS NULL;
ALTER TABLE products ALTER COLUMN original_price_mad SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'products'::regclass AND conname = 'products_original_price_mad_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_original_price_mad_check
      CHECK (original_price_mad > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'products'::regclass AND conname = 'products_sale_price_less_than_original_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_price_less_than_original_check
      CHECK (sale_price_mad IS NULL OR sale_price_mad < original_price_mad);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_public_category_idx
  ON products (category, name) WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS products_name_category_name_key
  ON products (lower(name), lower(category_name));

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 2 AND 160),
  phone TEXT NOT NULL CHECK (length(trim(phone)) BETWEEN 7 AND 32),
  city TEXT NOT NULL CHECK (length(trim(city)) BETWEEN 1 AND 120),
  address TEXT NOT NULL CHECK (length(trim(address)) BETWEEN 3 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery'
    CHECK (payment_method = 'cash_on_delivery'),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  subtotal_mad BIGINT NOT NULL CHECK (subtotal_mad >= 0),
  delivery_fee_mad INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_mad >= 0),
  total_mad BIGINT NOT NULL CHECK (total_mad >= subtotal_mad),
  customer_notes TEXT NOT NULL DEFAULT '' CHECK (length(customer_notes) <= 1000),
  idempotency_key UUID NOT NULL UNIQUE,
  receipt_token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_at_idx ON orders (status, created_at DESC);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_token_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_receipt_token_hash_idx
  ON orders (receipt_token_hash) WHERE receipt_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  unit_price_mad INTEGER NOT NULL CHECK (unit_price_mad >= 0),
  line_total_mad BIGINT NOT NULL CHECK (line_total_mad >= 0),
  UNIQUE (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  session_hash TEXT PRIMARY KEY,
  csrf_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
