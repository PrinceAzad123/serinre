/**
 * Sereni-Tea — Application
 *
 * Architecture:
 *   • Each feature is an isolated module (IIFE / plain object)
 *   • Modules communicate through a lightweight pub/sub event bus
 *   • All DOM interaction uses event-delegation on stable parent elements
 *   • Zero inline onclick handlers — everything wired via data-* attributes
 *
 * Depends on: data.js (TEAS, TEA_MAP, AI_TEMPLATES, AI_INTENT_KEYWORDS, …)
 */

"use strict";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Utilities
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Utils = {
  /** Safely escape HTML to prevent XSS in user-provided text. */
  escapeHTML(str) {
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  },

  /** Format a number as USD. */
  formatPrice(n) {
    return `$${n.toFixed(2)}`;
  },

  /** Query a single element. */
  $(selector, scope = document) {
    return scope.querySelector(selector);
  },

  /** Query all elements. */
  $$(selector, scope = document) {
    return [...scope.querySelectorAll(selector)];
  },

  /** Pick a random element from an array. */
  randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /** Generate a short order ID. */
  generateOrderId() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ST-${ts}-${rand}`;
  },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Event Bus — decouples modules
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Bus = (() => {
  const listeners = {};

  return {
    on(event, fn) {
      (listeners[event] ??= []).push(fn);
    },
    emit(event, data) {
      (listeners[event] ?? []).forEach((fn) => fn(data));
    },
  };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Toast — ephemeral notifications
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Toast = (() => {
  const DURATION_MS = 3000;
  let container;

  function init() {
    container = Utils.$("#toastContainer");
  }

  function show(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), DURATION_MS);
  }

  return { init, show };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Navbar
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Navbar = (() => {
  let navEl, linksEl, toggleBtn;

  function init() {
    navEl     = Utils.$("#navbar");
    linksEl   = Utils.$("#navLinks");
    toggleBtn = Utils.$('[data-action="toggle-mobile-menu"]');

    window.addEventListener("scroll", handleScroll, { passive: true });
    toggleBtn.addEventListener("click", toggleMobile);

    // Close mobile menu when a link is tapped
    linksEl.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMobile();
    });
  }

  function handleScroll() {
    navEl.classList.toggle("is-scrolled", window.scrollY > 20);
  }

  function toggleMobile() {
    const isOpen = linksEl.classList.toggle("is-open");
    toggleBtn.setAttribute("aria-expanded", isOpen);
    toggleBtn.querySelector(".material-symbols-outlined").textContent =
      isOpen ? "close" : "menu";
  }

  function closeMobile() {
    linksEl.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.querySelector(".material-symbols-outlined").textContent = "menu";
  }

  return { init };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Cart (state + UI)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Cart = (() => {
  let items = [];   // { id, qty }
  let sidebarEl, overlayEl, itemsEl, emptyEl, footerEl, totalEl, countEl;

  /* ── Helpers ── */

  function find(id) {
    return items.find((i) => i.id === id);
  }

  function totalQty() {
    return items.reduce((s, i) => s + i.qty, 0);
  }

  function totalPrice() {
    return items.reduce((s, i) => s + TEA_MAP[i.id].price * i.qty, 0);
  }

  /* ── Public API ── */

  function init() {
    sidebarEl = Utils.$("#cartSidebar");
    overlayEl = Utils.$("#overlay");
    itemsEl   = Utils.$("#cartItems");
    emptyEl   = Utils.$("#cartEmpty");
    footerEl  = Utils.$("#cartFooter");
    totalEl   = Utils.$("#cartTotal");
    countEl   = Utils.$("#cartCount");

    // Delegated events on the sidebar
    sidebarEl.addEventListener("click", handleSidebarClick);

    Bus.on("cart:add", addItem);
  }

  function addItem(id) {
    const existing = find(id);
    if (existing) {
      existing.qty++;
    } else {
      items.push({ id, qty: 1 });
    }
    render();
    const tea = TEA_MAP[id];
    Toast.show(`${tea.emoji} ${tea.name} added to cart!`);
  }

  function removeItem(id) {
    items = items.filter((i) => i.id !== id);
    render();
  }

  function changeQty(id, delta) {
    const item = find(id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) return removeItem(id);
    render();
  }

  function render() {
    // Badge
    const qty = totalQty();
    countEl.textContent = qty;
    countEl.classList.toggle("is-visible", qty > 0);

    // Empty state
    if (items.length === 0) {
      emptyEl.hidden = false;
      footerEl.hidden = true;
      Utils.$$(".cart-item", itemsEl).forEach((el) => el.remove());
      return;
    }

    emptyEl.hidden = true;
    footerEl.hidden = false;
    totalEl.textContent = Utils.formatPrice(totalPrice());

    // Rebuild item list
    Utils.$$(".cart-item", itemsEl).forEach((el) => el.remove());

    const fragment = document.createDocumentFragment();
    for (const { id, qty } of items) {
      const tea = TEA_MAP[id];
      const row = document.createElement("div");
      row.className = "cart-item";
      row.dataset.teaId = id;
      row.innerHTML = `
        <span class="cart-item__emoji">${tea.emoji}</span>
        <div class="cart-item__info">
          <div class="cart-item__name">${Utils.escapeHTML(tea.name)}</div>
          <div class="cart-item__price">${Utils.formatPrice(tea.price * qty)}</div>
          <div class="cart-item__qty">
            <button class="qty-btn" data-action="qty-down" aria-label="Decrease quantity">−</button>
            <span class="qty-num">${qty}</span>
            <button class="qty-btn" data-action="qty-up" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-item__remove icon-btn" data-action="remove-item" aria-label="Remove ${tea.name}">
          <span class="material-symbols-outlined" style="font-size:1.1rem">delete</span>
        </button>`;
      fragment.appendChild(row);
    }
    itemsEl.appendChild(fragment);
  }

  function handleSidebarClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const id = Number(btn.closest("[data-tea-id]")?.dataset.teaId);
    switch (btn.dataset.action) {
      case "qty-up":      changeQty(id, 1);  break;
      case "qty-down":    changeQty(id, -1); break;
      case "remove-item": removeItem(id);    break;
    }
  }

  function open() {
    AI.close();
    sidebarEl.classList.add("is-open");
    overlayEl.classList.add("is-visible");
  }

  function close() {
    sidebarEl.classList.remove("is-open");
    overlayEl.classList.remove("is-visible");
  }

  function getItems() {
    return items.map((i) => ({ ...TEA_MAP[i.id], qty: i.qty }));
  }

  function clear() {
    items = [];
    render();
  }

  return { init, open, close, getItems, totalPrice, totalQty, clear };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Menu (filter + render tea cards)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Menu = (() => {
  let gridEl, filtersEl;

  function init() {
    gridEl    = Utils.$("#menuGrid");
    filtersEl = Utils.$(".menu__filters");

    render("all");

    filtersEl.addEventListener("click", handleFilter);
    gridEl.addEventListener("click", handleCardClick);
  }

  function handleFilter(e) {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    Utils.$$(".filter-btn", filtersEl).forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    render(btn.dataset.filter);
  }

  function handleCardClick(e) {
    const btn = e.target.closest(".btn-add");
    if (!btn) return;
    const id = Number(btn.closest("[data-tea-id]").dataset.teaId);
    Bus.emit("cart:add", id);
  }

  function render(filter) {
    const list = filter === "all" ? TEAS : TEAS.filter((t) => t.category === filter);

    gridEl.innerHTML = list
      .map(
        (tea, i) => `
      <article class="tea-card" role="listitem" data-tea-id="${tea.id}"
               style="animation-delay:${i * 0.08}s">
        <div class="tea-card__image" style="background:${tea.bg}">
          <span aria-hidden="true">${tea.emoji}</span>
          ${tea.badge ? `<span class="tea-card__badge">${tea.badge}</span>` : ""}
        </div>
        <div class="tea-card__body">
          <div class="tea-card__category">${tea.category}</div>
          <h3 class="tea-card__name">${Utils.escapeHTML(tea.name)}</h3>
          <p class="tea-card__desc">${Utils.escapeHTML(tea.desc)}</p>
          <div class="tea-card__meta">
            <span>📍 ${tea.origin}</span>
            <span>☕ ${tea.caffeine}</span>
            <span>🌡️ ${tea.brew}</span>
          </div>
          <footer class="tea-card__footer">
            <div class="tea-card__price">${Utils.formatPrice(tea.price)} <small>/ 50g</small></div>
            <button class="btn-add" aria-label="Add ${tea.name} to cart">
              <span class="material-symbols-outlined" style="font-size:1rem">add_shopping_cart</span>
              Add
            </button>
          </footer>
        </div>
      </article>`
      )
      .join("");
  }

  return { init };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AI Chat Sidebar
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const AI = (() => {
  const TYPING_DELAY_MIN = 800;
  const TYPING_DELAY_MAX = 2000;

  let sidebarEl, overlayEl, messagesEl, formEl, inputEl, chipsEl;

  /* ── Init ── */

  function init() {
    sidebarEl  = Utils.$("#aiSidebar");
    overlayEl  = Utils.$("#overlay");
    messagesEl = Utils.$("#aiMessages");
    formEl     = Utils.$("#aiForm");
    inputEl    = Utils.$("#aiInput");
    chipsEl    = Utils.$("#aiChips");

    formEl.addEventListener("submit", handleSubmit);
    chipsEl.addEventListener("click", handleChip);

    // Delegated clicks on suggestion cards inside messages
    messagesEl.addEventListener("click", handleMsgClick);
  }

  /* ── Open / Close ── */

  function open() {
    Cart.close();
    sidebarEl.classList.add("is-open");
    overlayEl.classList.add("is-visible");
    inputEl.focus();
  }

  function close() {
    sidebarEl.classList.remove("is-open");
    overlayEl.classList.remove("is-visible");
  }

  /* ── Message rendering ── */

  function addMessage(html, isUser = false) {
    const wrapper = document.createElement("div");
    wrapper.className = `ai-msg ai-msg--${isUser ? "user" : "bot"}`;
    wrapper.innerHTML = `
      <span class="ai-msg__avatar" aria-hidden="true">${isUser ? "👤" : "🤖"}</span>
      <div class="ai-msg__bubble">${html}</div>`;
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "ai-msg ai-msg--bot";
    el.id = "aiTyping";
    el.innerHTML = `
      <span class="ai-msg__avatar" aria-hidden="true">🤖</span>
      <div class="ai-msg__bubble">
        <div class="ai-typing"><span></span><span></span><span></span></div>
      </div>`;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    Utils.$("#aiTyping")?.remove();
  }

  /* ── Intent detection ── */

  function detectIntent(text) {
    const lower = text.toLowerCase();

    // Greeting
    if (/^(hi|hello|hey|howdy|greetings)\b/i.test(lower)) return "greeting";

    // Thanks
    if (/\b(thank|thanks|thx|appreciate)\b/i.test(lower)) return "thanks";

    // Keyword scan — first match wins
    for (const { intent, words } of AI_INTENT_KEYWORDS) {
      if (words.some((w) => lower.includes(w))) return intent;
    }

    return "fallback";
  }

  /** Build the bot response HTML for a given intent. */
  function buildResponse(intent) {
    if (intent === "greeting") {
      return `<p>${Utils.randomFrom(AI_GREETINGS)}</p>`;
    }

    if (intent === "thanks") {
      return `<p>You're welcome! 🍵 It's my pleasure to help you discover great tea. Anything else?</p>`;
    }

    if (intent === "fallback") {
      return `<p>${Utils.randomFrom(AI_FALLBACKS)}</p>`;
    }

    const template = AI_TEMPLATES[intent];
    if (!template) return `<p>${Utils.randomFrom(AI_FALLBACKS)}</p>`;

    // Plain text template (brewing, price, order)
    if (typeof template === "string") return `<p>${template}</p>`;

    // Template with tea card suggestions
    const cards = template.teaIds
      .map((id) => {
        const tea = TEA_MAP[id];
        if (!tea) return "";
        return `
          <div class="tea-sug" data-tea-id="${tea.id}">
            <span class="tea-sug__emoji">${tea.emoji}</span>
            <div>
              <div class="tea-sug__name">${Utils.escapeHTML(tea.name)}</div>
              <div class="tea-sug__price">${Utils.formatPrice(tea.price)}</div>
            </div>
            <span class="btn-add" data-action="ai-add" style="padding:.3rem .6rem;font-size:.7rem">+ Add</span>
          </div>`;
      })
      .join("");

    return `<p>${template.text}</p>${cards}`;
  }

  /* ── Event handlers ── */

  function handleSubmit(e) {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    processMessage(text);
  }

  function handleChip(e) {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    processMessage(chip.dataset.msg);
  }

  function handleMsgClick(e) {
    const addBtn = e.target.closest('[data-action="ai-add"]');
    if (!addBtn) return;
    const id = Number(addBtn.closest("[data-tea-id]").dataset.teaId);
    Bus.emit("cart:add", id);
  }

  function processMessage(text) {
    addMessage(`<p>${Utils.escapeHTML(text)}</p>`, true);
    showTyping();

    const delay = TYPING_DELAY_MIN + Math.random() * (TYPING_DELAY_MAX - TYPING_DELAY_MIN);
    setTimeout(() => {
      hideTyping();
      const intent = detectIntent(text);
      addMessage(buildResponse(intent));
    }, delay);
  }

  return { init, open, close };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Checkout Modal
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Checkout = (() => {
  const FREE_SHIPPING_THRESHOLD = 50;
  const SHIPPING_COST = 4.99;

  let modalEl, summaryEl;

  function init() {
    modalEl   = Utils.$("#checkoutModal");
    summaryEl = Utils.$("#orderSummary");

    // Delegated click handler for step navigation + place order
    modalEl.addEventListener("click", handleClick);

    // Close on backdrop click
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });
  }

  function open() {
    if (Cart.totalQty() === 0) return;
    Cart.close();
    goToStep(1);
    modalEl.classList.add("is-active");
  }

  function close() {
    modalEl.classList.remove("is-active");
  }

  function handleClick(e) {
    const btn = e.target.closest("[data-action], [data-goto-step]");
    if (!btn) return;

    if (btn.dataset.gotoStep) {
      goToStep(Number(btn.dataset.gotoStep));
    } else if (btn.dataset.action === "close-checkout") {
      close();
    } else if (btn.dataset.action === "place-order") {
      placeOrder();
    }
  }

  function goToStep(n) {
    // Update step indicators
    Utils.$$(".steps__item", modalEl).forEach((el) => {
      el.classList.toggle("is-active", Number(el.dataset.step) <= n);
    });

    // Show pane
    Utils.$$(".step-pane", modalEl).forEach((p) => p.classList.remove("is-active"));
    Utils.$(`#step${n}`, modalEl).classList.add("is-active");

    if (n === 3) renderSummary();
  }

  function renderSummary() {
    const items = Cart.getItems();
    const subtotal = Cart.totalPrice();
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shipping;

    summaryEl.innerHTML = `
      <h4>Order Summary</h4>
      ${items
        .map(
          (i) => `
        <div class="order-summary__item">
          <span>${i.emoji} ${Utils.escapeHTML(i.name)} × ${i.qty}</span>
          <span>${Utils.formatPrice(i.price * i.qty)}</span>
        </div>`
        )
        .join("")}
      <div class="order-summary__item">
        <span>Subtotal</span>
        <span>${Utils.formatPrice(subtotal)}</span>
      </div>
      <div class="order-summary__item">
        <span>Delivery ${shipping === 0 ? "(Free!)" : ""}</span>
        <span>${shipping === 0 ? "FREE" : Utils.formatPrice(shipping)}</span>
      </div>
      <div class="order-summary__total">
        <span>Total</span>
        <span>${Utils.formatPrice(total)}</span>
      </div>`;
  }

  function placeOrder() {
    const orderId = Utils.generateOrderId();

    close();
    Success.show(orderId);
    Cart.clear();

    // Reset form fields
    Utils.$$("input, textarea", modalEl).forEach((el) => {
      if (el.tagName === "TEXTAREA" || el.type !== "submit") el.value = "";
    });
  }

  return { init, open, close };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Success Modal
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Success = (() => {
  let modalEl, orderIdEl;

  function init() {
    modalEl   = Utils.$("#successModal");
    orderIdEl = Utils.$("#orderId");
  }

  function show(orderId) {
    orderIdEl.textContent = `Order #${orderId}`;
    modalEl.classList.add("is-active");
  }

  function close() {
    modalEl.classList.remove("is-active");
  }

  return { init, show, close };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Newsletter Form
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Newsletter = (() => {
  function init() {
    Utils.$("#newsletterForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = Utils.$("input", e.target);
      Toast.show(`🎉 Welcome to the Tea Circle! Check your inbox for 15% off.`);
      input.value = "";
    });
  }

  return { init };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Scroll Animations (IntersectionObserver)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const ScrollReveal = (() => {
  const SELECTOR = ".feature, .testimonial, .about__card";

  function init() {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target); // animate once
          }
        }
      },
      { threshold: 0.1 }
    );

    for (const el of Utils.$$(SELECTOR)) {
      Object.assign(el.style, {
        opacity: "0",
        transform: "translateY(20px)",
        transition: "opacity .6s ease, transform .6s ease",
      });
      observer.observe(el);
    }
  }

  return { init };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Global Action Router

   Single delegated listener on <body> for all
   data-action buttons not owned by a specific module.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function initGlobalActions() {
  const overlay = Utils.$("#overlay");

  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    switch (btn.dataset.action) {
      case "toggle-cart":   Cart.open();      break;
      case "close-cart":    Cart.close();     break;
      case "toggle-ai":     AI.open();        break;
      case "close-ai":      AI.close();       break;
      case "open-checkout":  Checkout.open();  break;
      case "close-checkout": Checkout.close(); break;
      case "close-success":  Success.close();  break;
      case "place-order":    /* handled inside Checkout */ break;
    }
  });

  // Click overlay → close everything
  overlay.addEventListener("click", () => {
    Cart.close();
    AI.close();
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Bootstrap
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

document.addEventListener("DOMContentLoaded", () => {
  Toast.init();
  Navbar.init();
  Menu.init();
  Cart.init();
  AI.init();
  Checkout.init();
  Success.init();
  Newsletter.init();
  ScrollReveal.init();
  initGlobalActions();
});
