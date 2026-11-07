(() => {
      "use strict";

      const money = new Intl.NumberFormat("ar-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 });
      const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      const loginScreen = document.getElementById("admin-login-screen");
      const app = document.getElementById("dashboard-app");
      const loginForm = document.getElementById("admin-login-form");
      const loginError = document.getElementById("login-error");
      const productForm = document.getElementById("product-form");
      const modal = document.getElementById("product-modal");
      const imagePreview = document.getElementById("image-preview");
      let csrfToken = "";
      let products = [];
      let orders = [];
      let editingId = "";
      let toastTimer;

      const dateNow = new Date();
      document.getElementById("today-label").textContent = new Intl.DateTimeFormat("ar-MA", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }).format(dateNow);
      document.getElementById("date-chip-label").textContent = new Intl.DateTimeFormat("ar-MA", {
        day: "numeric", month: "short"
      }).format(dateNow);

      function safeText(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
          "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        })[char]);
      }

      function notify(message, error = false) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.style.background = error ? "var(--red)" : "var(--navy)";
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
      }

      function setLoginMessage(message) {
        loginError.textContent = message;
        loginError.hidden = !message;
      }

      function showLogin(message = "") {
        csrfToken = "";
        app.hidden = true;
        loginScreen.hidden = false;
        setLoginMessage(message);
      }

      function showDashboard(email) {
        loginScreen.hidden = true;
        app.hidden = false;
        document.getElementById("admin-account").textContent = email;
      }

      async function api(url, options = {}) {
        const headers = new Headers(options.headers || {});
        let body = options.body;
        if (body && typeof body !== "string" && !(body instanceof Blob)) {
          headers.set("Content-Type", "application/json");
          body = JSON.stringify(body);
        }
        if (csrfToken && options.method && options.method !== "GET") headers.set("X-CSRF-Token", csrfToken);
        const response = await fetch(url, {
          ...options, headers, body, credentials: "same-origin", cache: "no-store"
        });
        const payload = response.status === 204 ? null : await response.json().catch(() => null);
        if (!response.ok) {
          const error = new Error(payload?.error || "تعذر إكمال العملية. حاول مرة أخرى.");
          error.status = response.status;
          throw error;
        }
        return payload;
      }

      function handleApiError(error) {
        if (error.status === 401) showLogin("انتهت الجلسة. دخل من جديد.");
        else notify(error.message, true);
      }

      function productStatus(product) {
        if (!product.is_active) return "مخفي";
        if (!product.price_verified || !product.inventory_verified) return "بانتظار التحقق";
        if (Number(product.stock_on_hand) === 0) return "غير متوفر";
        if (Number(product.stock_on_hand) <= 5) return "مخزون ناقص";
        return "متوفر";
      }

      function statusClass(status) {
        if (["متوفر", "تسلّم"].includes(status)) return "status-delivered";
        if (["مخزون ناقص", "جديد", "بانتظار التحقق"].includes(status)) return "status-new";
        return "status-transit";
      }

      function productImageMarkup(product, className = "phone-thumb") {
        const uploadedImage = typeof product.image_url === "string" &&
          product.image_url.startsWith("/images/");
        const illustrationIndex = [...String(product.id || product.name || "")]
          .reduce((total, character) => total + character.charCodeAt(0), 0) % 3 + 1;
        const imageUrl = uploadedImage
          ? product.image_url
          : `/images/products/phone-${illustrationIndex}.svg`;
        return `<img class="${className}" src="${safeText(imageUrl)}" alt="صورة ${safeText(product.name || "الهاتف")}" loading="lazy">`;
      }

      function mapOrderStatus(status) {
        if (status === "shipped") return "في الطريق";
        if (status === "delivered") return "تسلّم";
        if (status === "cancelled") return "ملغى";
        return "جديد";
      }

      function orderProducts(order) {
        return Array.isArray(order.products) ? order.products : [];
      }

      function renderMetrics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sales = orders.filter(order => new Date(order.created_at) >= today && !["pending", "cancelled"].includes(order.status))
          .reduce((sum, order) => sum + Number(order.total_mad), 0);
        const pending = orders.filter(order => order.status === "pending").length;
        const stockCount = products.reduce((sum, product) => sum + Math.max(0, Number(product.stock_on_hand) || 0), 0);
        const lowStock = products.filter(product => Number(product.stock_on_hand) > 0 && Number(product.stock_on_hand) <= 5).length;
        document.getElementById("metric-sales").textContent = money.format(sales);
        document.getElementById("metric-new-orders").textContent = pending.toLocaleString("ar-MA");
        document.getElementById("metric-stock").textContent = stockCount.toLocaleString("ar-MA");
        document.getElementById("metric-low-stock").textContent = lowStock.toLocaleString("ar-MA");
      }

      function renderTopProducts() {
        const totals = new Map();
        orders.filter(order => order.status !== "cancelled").forEach(order => {
          orderProducts(order).forEach(item => {
            const product = products.find(candidate => candidate.id === item.productId);
            const current = totals.get(item.productId) || {
              id: item.productId,
              name: item.name,
              image_url: product?.image_url,
              quantity: 0
            };
            current.quantity += Number(item.quantity);
            totals.set(item.productId, current);
          });
        });
        const best = [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 4);
        const container = document.getElementById("top-products");
        container.innerHTML = best.length ? best.map(item => `
          <div class="top-product">${productImageMarkup(item)}
            <span class="top-product-name"><strong>${safeText(item.name)}</strong><span>حسب الطلبات المسجلة</span></span>
            <span class="top-product-sales">${item.quantity.toLocaleString("ar-MA")} مبيعة</span>
          </div>`).join("") : '<div class="empty-state">ما كايناش مبيعات مسجلة بعد.</div>';
      }

      function renderRecentOrders() {
        const recent = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        document.getElementById("recent-orders-body").innerHTML = recent.length ? recent.map(order => {
          const items = orderProducts(order).map(item => `${safeText(item.name)} × ${Number(item.quantity)}`).join("، ") || "—";
          const id = String(order.id).slice(0, 8).toUpperCase();
          const status = mapOrderStatus(order.status);
          return `<tr><td><strong>${safeText(id)}</strong></td><td>${safeText(order.full_name)}</td><td>${items}</td>
            <td><strong>${money.format(Number(order.total_mad))}</strong></td><td><span class="status ${statusClass(status)}">${status}</span></td></tr>`;
        }).join("") : '<tr><td class="empty-state" colspan="5">ما كايناش طلبات مسجلة.</td></tr>';
      }

      function fillBrandFilter() {
        const select = document.getElementById("brand-filter");
        const selected = select.value;
        const brands = [...new Set(products.map(product => product.category_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
        select.innerHTML = '<option value="">جميع الماركات</option>' + brands.map(brand =>
          `<option value="${safeText(brand)}">${safeText(brand)}</option>`).join("");
        select.value = brands.includes(selected) ? selected : "";
      }

      function renderProducts() {
        const query = document.getElementById("product-search").value.trim().toLocaleLowerCase("ar");
        const brand = document.getElementById("brand-filter").value;
        const filtered = products.filter(product => (!brand || product.category_name === brand) &&
          (!query || `${product.name} ${product.category_name} ${product.id}`.toLocaleLowerCase("ar").includes(query)));
        document.getElementById("product-count").textContent = `${filtered.length.toLocaleString("ar-MA")} منتجات`;
        const body = document.getElementById("products-body");
        body.innerHTML = filtered.length ? filtered.map(product => {
          const stock = product.stock_on_hand === null ? "غير محدد" : Number(product.stock_on_hand).toLocaleString("ar-MA");
          const currentPrice = Number(product.price_mad);
          const originalPrice = Number(product.original_price_mad || product.price_mad);
          const priceText = `<strong>${money.format(currentPrice)}</strong>${originalPrice > currentPrice ? `<small class="muted-cell">الأصلي: ${money.format(originalPrice)}</small>` : ""}`;
          const status = productStatus(product);
          return `<tr>
            <td><div class="product-name-cell">${productImageMarkup(product)}<span><strong>${safeText(product.name)}</strong><small>${safeText(product.id)}</small></span></div></td>
            <td><span class="brand-pill">${safeText(product.category_name)}</span></td><td>${priceText}</td>
            <td class="${Number(product.stock_on_hand) <= 5 ? "stock-low" : ""}">${stock} قطعة</td>
            <td><span class="status ${statusClass(status)}">${status}</span></td>
            <td><div class="row-actions"><button class="row-action" type="button" data-edit-product="${safeText(product.id)}" aria-label="تعديل ${safeText(product.name)}" title="تعديل">✎</button>
            <button class="row-action delete" type="button" data-delete-product="${safeText(product.id)}" aria-label="حذف ${safeText(product.name)}" title="حذف">⌫</button></div></td>
          </tr>`;
        }).join("") : '<tr><td class="empty-state" colspan="6">ما لقينا حتى منتج مطابق.</td></tr>';
      }

      function renderOrders() {
        const query = document.getElementById("order-search").value.trim().toLocaleLowerCase("ar");
        const statusFilter = document.getElementById("order-status-filter").value;
        const filtered = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).filter(order => {
          const status = mapOrderStatus(order.status);
          const items = orderProducts(order).map(item => item.name).join(" ");
          return (!statusFilter || status === statusFilter) &&
            (!query || `${order.id} ${order.full_name} ${order.city} ${items}`.toLocaleLowerCase("ar").includes(query));
        });
        document.getElementById("order-count").textContent = `${filtered.length.toLocaleString("ar-MA")} طلبات`;
        const body = document.getElementById("orders-body");
        body.innerHTML = filtered.length ? filtered.map(order => {
          const items = orderProducts(order).map(item => `${safeText(item.name)} × ${Number(item.quantity)}`).join("، ") || "—";
          const visibleStatus = mapOrderStatus(order.status);
          const selectedValue = visibleStatus === "في الطريق" ? "transit" : visibleStatus === "تسلّم" ? "delivered" : visibleStatus === "ملغى" ? "cancelled" : "new";
          const disabled = ["delivered", "cancelled"].includes(order.status) ? " disabled" : "";
          const id = String(order.id).slice(0, 8).toUpperCase();
          return `<tr><td><strong>${safeText(id)}</strong></td><td><strong>${safeText(order.full_name)}</strong></td>
            <td class="muted-cell">${safeText(order.city)}</td><td>${items}</td><td><strong>${money.format(Number(order.total_mad))}</strong></td>
            <td><select class="order-status-select" data-order-status="${safeText(order.id)}" aria-label="حالة الطلب ${safeText(id)}"${disabled}>
              <option value="new"${selectedValue === "new" ? " selected" : ""}>جديد</option>
              <option value="transit"${selectedValue === "transit" ? " selected" : ""}>في الطريق</option>
              <option value="delivered"${selectedValue === "delivered" ? " selected" : ""}>تسلّم</option>
              ${selectedValue === "cancelled" ? '<option value="cancelled" selected>ملغى</option>' : ""}
            </select></td></tr>`;
        }).join("") : '<tr><td class="empty-state" colspan="6">ما لقينا حتى طلب مطابق.</td></tr>';
      }

      function drawChart() {
        const canvas = document.getElementById("sales-chart");
        const wrap = document.getElementById("chart-wrap");
        const rect = wrap.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const scale = window.devicePixelRatio || 1;
        canvas.width = Math.round(rect.width * scale);
        canvas.height = Math.round(rect.height * scale);
        const context = canvas.getContext("2d");
        context.scale(scale, scale);
        const styles = getComputedStyle(document.body);
        const pad = { top: 12, right: 40, bottom: 28, left: 8 };
        const width = rect.width - pad.left - pad.right;
        const height = rect.height - pad.top - pad.bottom;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 6);
        const days = Array.from({ length: 7 }, (_, index) => {
          const day = new Date(start);
          day.setDate(day.getDate() + index);
          const next = new Date(day);
          next.setDate(next.getDate() + 1);
          const value = orders.filter(order => {
            const created = new Date(order.created_at);
            return created >= day && created < next && !["pending", "cancelled"].includes(order.status);
          }).reduce((sum, order) => sum + Number(order.total_mad), 0);
          return { day, value, label: new Intl.DateTimeFormat("ar-MA", { weekday: "short" }).format(day) };
        });
        const max = Math.max(...days.map(item => item.value), 1000);
        context.font = "9px Tahoma, Arial";
        for (let index = 0; index < 4; index++) {
          const y = pad.top + height * index / 3;
          context.beginPath();
          context.strokeStyle = styles.getPropertyValue("--line").trim();
          context.moveTo(pad.left, y);
          context.lineTo(pad.left + width, y);
          context.stroke();
          context.fillStyle = styles.getPropertyValue("--muted").trim();
          context.textAlign = "right";
          context.textBaseline = "middle";
          context.fillText(money.format(Math.round(max * (1 - index / 3))), rect.width - 3, y);
        }
        const gap = width / 7;
        const barWidth = Math.min(28, gap * .5);
        days.forEach((item, index) => {
          const barHeight = Math.max(3, height * item.value / max);
          const x = pad.left + gap * index + (gap - barWidth) / 2;
          context.beginPath();
          context.roundRect(x, pad.top + height - barHeight, barWidth, barHeight, 5);
          context.fillStyle = styles.getPropertyValue("--green").trim();
          context.globalAlpha = index === 6 ? 1 : .68;
          context.fill();
          context.globalAlpha = 1;
          context.fillStyle = styles.getPropertyValue("--muted").trim();
          context.textAlign = "center";
          context.textBaseline = "top";
          context.fillText(item.label, x + barWidth / 2, pad.top + height + 9);
        });
      }

      function renderAll() {
        renderMetrics();
        renderTopProducts();
        renderRecentOrders();
        renderProducts();
        renderOrders();
        requestAnimationFrame(drawChart);
      }

      async function loadData() {
        document.getElementById("dashboard-error").hidden = true;
        try {
          const [productResult, orderResult] = await Promise.all([
            api("/api/admin/products"),
            api("/api/admin/orders?limit=100&offset=0")
          ]);
          products = Array.isArray(productResult.products) ? productResult.products : [];
          orders = Array.isArray(orderResult.orders) ? orderResult.orders : [];
          fillBrandFilter();
          renderAll();
        } catch (error) {
          if (error.status === 401) showLogin("انتهت الجلسة. دخل من جديد.");
          else {
            const message = error.message || "تعذر تحميل بيانات المتجر.";
            const alert = document.getElementById("dashboard-error");
            alert.textContent = message;
            alert.hidden = false;
            console.error("تعذر تحميل بيانات لوحة PhoneX.", error);
          }
        }
      }

      function slugId(name) {
        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const base = slug || `phone-${Date.now().toString(36)}`;
        return products.some(product => product.id === base) ? `${base}-${Date.now().toString(36)}` : base;
      }

      function openModal(product = null) {
        productForm.reset();
        editingId = product?.id || "";
        const field = name => productForm.elements.namedItem(name);
        document.getElementById("modal-title").textContent = product ? "تعديل المنتج" : "زيد منتج جديد";
        field("name").value = product?.name || "";
        const brandSelect = field("brand");
        const brand = product?.category_name || "";
        if (brand && ![...brandSelect.options].some(option => option.value === brand)) {
          brandSelect.add(new Option(brand, brand));
        }
        brandSelect.value = brand;
        field("price").value = product ? String(product.original_price_mad || product.price_mad) : "";
        field("salePrice").value = product?.sale_price_mad == null ? "" : String(product.sale_price_mad);
        field("stock").value = product?.stock_on_hand == null ? "0" : String(product.stock_on_hand);
        field("description").value = product?.specification || "";
        field("imageUrl").value = product?.image_url || "";
        field("tag").value = product?.tag || "";
        field("verified").checked = Boolean(product?.price_verified && product?.inventory_verified);
        field("published").checked = Boolean(product?.is_active);
        if (product?.image_url) {
          imagePreview.src = product.image_url;
          imagePreview.hidden = false;
        } else {
          imagePreview.removeAttribute("src");
          imagePreview.hidden = true;
        }
        modal.classList.add("open");
        field("name").focus();
      }

      function closeModal() {
        modal.classList.remove("open");
        productForm.reset();
        imagePreview.removeAttribute("src");
        imagePreview.hidden = true;
        editingId = "";
      }

      async function uploadImage(file) {
        if (!file) return productForm.elements.namedItem("imageUrl").value.trim();
        if (!imageTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
          throw new Error("الصورة خاصها تكون JPEG أو PNG أو WebP وبحجم أقل من 5MB.");
        }
        const response = await fetch("/api/admin/products/image", {
          method: "POST",
          headers: { "Content-Type": file.type, "X-CSRF-Token": csrfToken },
          credentials: "same-origin", cache: "no-store", body: file
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || typeof result?.imageUrl !== "string") {
          const error = new Error(result?.error || "تعذر رفع الصورة.");
          error.status = response.status;
          throw error;
        }
        return result.imageUrl;
      }

      async function saveProduct(event) {
        event.preventDefault();
        if (!productForm.reportValidity()) return;
        const field = name => productForm.elements.namedItem(name);
        const button = productForm.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
          const name = field("name").value.trim();
          const brand = field("brand").value;
          const duplicate = products.some(item =>
            item.id !== editingId &&
            item.name.trim().toLocaleLowerCase("ar") === name.toLocaleLowerCase("ar") &&
            item.category_name.trim().toLocaleLowerCase("ar") === brand.toLocaleLowerCase("ar")
          );
          if (duplicate) throw new Error("هذا المنتج مسجل من قبل لهذه الماركة.");
          const imageUrl = await uploadImage(field("imageFile").files[0]);
          const verified = field("verified").checked;
          const product = {
            id: editingId || slugId(name),
            name,
            category: "phones",
            categoryName: brand,
            specification: field("description").value.trim(),
            originalPriceMad: Number(field("price").value),
            salePriceMad: field("salePrice").value === "" ? null : Number(field("salePrice").value),
            tag: field("tag").value,
            imageUrl,
            stockOnHand: Number(field("stock").value),
            priceVerified: verified,
            inventoryVerified: verified,
            isActive: field("published").checked
          };
          const route = editingId ? `/api/admin/products/${encodeURIComponent(editingId)}` : "/api/admin/products";
          const result = await api(route, { method: editingId ? "PUT" : "POST", body: product });
          closeModal();
          await loadData();
          notify(result.product.is_active ? "تحفظ المنتج وتعرض فالمتجر." : "تحفظ المنتج. راجع التحقق والنشر باش يبان للزبناء.");
        } catch (error) {
          if (error.status === 401) showLogin("انتهت الجلسة. دخل من جديد.");
          else notify(error.message, true);
        } finally {
          button.disabled = false;
        }
      }

      async function deleteProduct(id) {
        const product = products.find(item => item.id === id);
        if (!product || !window.confirm(`واش متأكد بغيتي تحذف ${product.name}؟`)) return;
        try {
          await api(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
          await loadData();
          notify("تحذف المنتج.");
        } catch (error) {
          handleApiError(error);
        }
      }

      async function updateOrder(id, requested) {
        const order = orders.find(item => item.id === id);
        if (!order) return;
        if (requested === "new") return;
        const target = requested === "transit" ? "shipped" : "delivered";
        const path = {
          pending: ["confirmed", "processing", "shipped", "delivered"],
          confirmed: ["processing", "shipped", "delivered"],
          processing: ["shipped", "delivered"],
          shipped: ["delivered"], delivered: [], cancelled: []
        }[order.status] || [];
        const targetIndex = path.indexOf(target);
        if (targetIndex < 0) {
          notify("ما يمكنش نرجعو الطلب لمرحلة سابقة.", true);
          renderOrders();
          return;
        }
        const steps = path.slice(0, targetIndex + 1);
        try {
          for (const status of steps) {
            const result = await api(`/api/admin/orders/${encodeURIComponent(id)}`, {
              method: "PATCH", body: { status }
            });
            order.status = result.order.status;
          }
          renderAll();
          notify("تبدلات حالة الطلب.");
        } catch (error) {
          renderAll();
          handleApiError(error);
        }
      }

      async function initialize() {
        try {
          const session = await api("/api/admin/session");
          csrfToken = session.csrfToken;
          showDashboard(session.email);
          await loadData();
        } catch (error) {
          showLogin(error.status === 401 ? "" : error.message);
        }
      }

      loginForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!loginForm.reportValidity()) return;
        const button = loginForm.querySelector('button[type="submit"]');
        button.disabled = true;
        setLoginMessage("");
        const values = new FormData(loginForm);
        try {
          const result = await api("/api/admin/login", {
            method: "POST", body: { email: values.get("email"), password: values.get("password") }
          });
          csrfToken = result.csrfToken;
          loginForm.reset();
          showDashboard(result.email);
          await loadData();
        } catch (error) {
          setLoginMessage(error.message);
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById("logout-button").addEventListener("click", async event => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
          await api("/api/admin/logout", { method: "POST" });
          showLogin();
        } catch (error) {
          handleApiError(error);
        } finally {
          button.disabled = false;
        }
      });

      document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => {
        const name = button.dataset.section;
        document.querySelectorAll(".section").forEach(section => section.classList.toggle("active", section.id === `section-${name}`));
        document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item === button));
        document.getElementById("page-title").textContent = name === "dashboard" ? "صباح الخير، المسؤول 👋" : name === "products" ? "تدبير المنتجات 📱" : "تدبير الطلبات 📦";
        if (name === "dashboard") requestAnimationFrame(drawChart);
      }));
      document.querySelectorAll("[data-go]").forEach(link => link.addEventListener("click", event => {
        event.preventDefault();
        document.querySelector(`[data-section="${link.dataset.go}"]`).click();
      }));
      document.getElementById("product-search").addEventListener("input", renderProducts);
      document.getElementById("brand-filter").addEventListener("change", renderProducts);
      document.getElementById("order-search").addEventListener("input", renderOrders);
      document.getElementById("order-status-filter").addEventListener("change", renderOrders);
      document.getElementById("top-add-product").addEventListener("click", () => openModal());
      document.querySelectorAll(".add-product-button").forEach(button => button.addEventListener("click", () => openModal()));
      document.getElementById("modal-close").addEventListener("click", closeModal);
      document.getElementById("modal-cancel").addEventListener("click", closeModal);
      modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
      document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
      productForm.addEventListener("submit", saveProduct);
      productForm.elements.namedItem("imageFile").addEventListener("change", event => {
        const file = event.currentTarget.files[0];
        if (!file) return;
        if (!imageTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
          notify("الصورة خاصها تكون JPEG أو PNG أو WebP وبحجم أقل من 5MB.", true);
          event.currentTarget.value = "";
          return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          if (typeof reader.result === "string") {
            imagePreview.src = reader.result;
            imagePreview.hidden = false;
          }
        });
        reader.addEventListener("error", () => notify("تعذرت قراءة الصورة.", true));
        reader.readAsDataURL(file);
      });
      document.getElementById("products-body").addEventListener("click", event => {
        const edit = event.target.closest("[data-edit-product]");
        const remove = event.target.closest("[data-delete-product]");
        if (edit) openModal(products.find(product => product.id === edit.dataset.editProduct));
        if (remove) deleteProduct(remove.dataset.deleteProduct);
      });
      document.getElementById("orders-body").addEventListener("change", event => {
        const select = event.target.closest("[data-order-status]");
        if (!select) return;
        select.disabled = true;
        updateOrder(select.dataset.orderStatus, select.value).finally(() => { select.disabled = false; });
      });
      document.getElementById("theme-toggle").addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const dark = document.body.classList.contains("dark");
        document.getElementById("theme-toggle").textContent = dark ? "☀" : "☾";
        try { localStorage.setItem("phonex-dashboard-dark", dark ? "1" : "0"); }
        catch (error) { console.warn("تعذر حفظ إعداد الوضع الليلي.", error); }
        drawChart();
      });
      try {
        if (localStorage.getItem("phonex-dashboard-dark") === "1") {
          document.body.classList.add("dark");
          document.getElementById("theme-toggle").textContent = "☀";
        }
      } catch (error) { console.warn("تعذر قراءة إعداد الوضع الليلي.", error); }
      window.addEventListener("resize", () => requestAnimationFrame(drawChart));

      initialize();
    })();
