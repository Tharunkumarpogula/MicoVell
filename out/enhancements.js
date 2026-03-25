/**
 * MicoVell - Full Standalone Cart System + Section Image Fix + Enhancements
 * Works independently of Next.js React chunks
 */
(function () {
  'use strict';

  const CART_KEY = 'micovell_cart';
  const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 11.15c0-4.4-3.6-8.05-8-8.05s-8 3.65-8 8.05c0 4.4 3.6 7.95 8 7.95 1.2 0 2.8-.3 4.4-.8"/>
    <path d="M4.6 11.15C4.6 6.75 8.2 3.1 12.6 3.1s8 3.65 8 8.05"/>
    <path d="M12.6 21v-8.05"/>
    <path d="M10.2 18a2.4 2.4 0 0 1-2.4-2.4"/>
    <path d="M15 18a2.4 2.4 0 0 0 2.4-2.4"/>
  </svg>`;

  /* ============================================
     CART STORAGE
  ============================================ */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ ...product, quantity: 1 }); }
    saveCart(cart);
    updateCartBadge();
    return cart;
  }
  function removeFromCart(id) {
    const cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
    updateCartBadge();
    return cart;
  }
  function updateQty(id, qty) {
    if (qty <= 0) return removeFromCart(id);
    const cart = getCart().map(i => i.id === id ? { ...i, quantity: qty } : i);
    saveCart(cart);
    updateCartBadge();
    return cart;
  }
  function clearCart() { saveCart([]); updateCartBadge(); }
  function getCartTotal(cart) { return cart.reduce((s, i) => s + i.price * i.quantity, 0); }
  function getCartCount(cart) { return (cart || getCart()).reduce((s, i) => s + i.quantity, 0); }

  /* ============================================
     PAGE LOADER
  ============================================ */
  let loader;
  function createLoader() {
    loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = `<div class="loader-logo">${LOGO_SVG}</div><div class="loader-brand">MicoVell</div><div class="loader-bar-wrap"><div class="loader-bar"></div></div>`;
    document.body.appendChild(loader);
  }
  function hideLoader() {
    if (!loader) return;
    const bar = loader.querySelector('.loader-bar');
    if (bar) bar.style.width = '100%';
    setTimeout(() => loader.classList.add('hidden'), 250);
  }
  function showLoader() {
    if (!loader) return;
    const bar = loader.querySelector('.loader-bar');
    if (bar) { bar.style.animation = 'none'; bar.style.width = '0%'; void bar.offsetWidth; bar.style.animation = 'loader-progress 0.8s ease forwards'; }
    loader.classList.remove('hidden');
  }

  /* ============================================
     OFFLINE SCREEN
  ============================================ */
  let offlineEl;
  function createOfflineScreen() {
    offlineEl = document.createElement('div');
    offlineEl.id = 'offline-screen';
    offlineEl.innerHTML = `<div class="offline-logo">${LOGO_SVG}</div><div class="offline-title">You're offline</div><div class="offline-sub">Please check your internet connection. MicoVell will reconnect automatically.</div><div class="offline-dots"><span></span><span></span><span></span></div>`;
    document.body.appendChild(offlineEl);
  }
  function checkOnline() {
    if (!navigator.onLine) offlineEl.classList.add('visible');
    else offlineEl.classList.remove('visible');
  }

  /* ============================================
     CART BADGE
  ============================================ */
  function updateCartBadge() {
    const count = getCartCount();
    document.querySelectorAll('a[href="/cart"]').forEach(link => {
      link.style.position = 'relative';
      let badge = link.querySelector('.cart-badge');
      if (count > 0) {
        if (!badge) { badge = document.createElement('span'); badge.className = 'cart-badge'; link.appendChild(badge); }
        badge.textContent = count > 99 ? '99+' : count;
      } else { if (badge) badge.remove(); }
    });
  }

  /* ============================================
     TOAST NOTIFICATION
  ============================================ */
  function showToast(msg, type) {
    const existing = document.querySelector('.add-cart-success');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'add-cart-success';
    const color = type === 'remove' ? '#f87171' : type === 'info' ? '#60a5fa' : '#4ade80';
    toast.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 350); }, 2800);
  }

  /* ============================================
     EXTRACT PRODUCT FROM SHOP CARD
  ============================================ */
  function extractProductFromCard(card) {
    // Product name - try multiple selectors
    const nameEl = card.querySelector('h3, h2, [class*="font-semibold"], a[href*="/shop/"]');
    const name = nameEl ? nameEl.textContent.trim() : 'Product';

    // Price - look for ₹ symbol
    let price = 0;
    card.querySelectorAll('p, span, div').forEach(el => {
      const text = el.textContent.trim();
      const match = text.match(/₹\s*([\d,]+(?:\.\d+)?)/);
      if (match && price === 0) price = parseFloat(match[1].replace(/,/g, ''));
    });

    // Image
    const img = card.querySelector('img');
    const image = img ? (img.src || img.getAttribute('src') || '/images/products/cordy_powder.png') : '/images/products/cordy_powder.png';

    // ID from slug or name hash
    const link = card.querySelector('a[href*="/shop/"]');
    let id = '';
    if (link) {
      const parts = link.href.split('/shop/');
      id = parts[1] ? parts[1].replace(/\/$/, '') : '';
    }
    if (!id) id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return { id, name, price, image };
  }

  /* ============================================
     ADD TO CART BUTTONS
  ============================================ */
  const patchedButtons = new WeakSet();
  function attachCartListeners() {
    document.querySelectorAll('button').forEach(btn => {
      if (patchedButtons.has(btn)) return;
      if (!btn.textContent.trim().includes('Add to Cart')) return;
      patchedButtons.add(btn);
      btn.addEventListener('click', () => {
        const card = btn.closest('[class*="rounded-lg"]') || btn.closest('article') || btn.parentElement?.parentElement;
        const product = extractProductFromCard(card || document.body);
        addToCart(product);
        showToast(`${product.name} added to cart!`, 'add');
        // Visual feedback on button
        const origText = btn.textContent;
        btn.textContent = '✓ Added!';
        btn.style.background = '#16a34a';
        setTimeout(() => { btn.textContent = origText; btn.style.background = ''; }, 1500);
      });
    });
  }
  function watchForButtons() {
    const observer = new MutationObserver(attachCartListeners);
    observer.observe(document.body, { childList: true, subtree: true });
    attachCartListeners();
  }

  /* ============================================
     CART PAGE RENDERER
  ============================================ */
  function renderCartPage() {
    const path = window.location.pathname;
    if (path !== '/cart' && !path.endsWith('/cart') && !path.endsWith('/cart/')) return;

    const main = document.querySelector('main');
    if (!main) return;

    function renderCart() {
      const cart = getCart();
      const subtotal = getCartTotal(cart);
      const shipping = subtotal > 0 ? 50 : 0;
      const handling = subtotal > 0 ? 25 : 0;
      const total = subtotal + shipping + handling;

      main.innerHTML = '';
      main.style.cssText = 'padding: 2rem 1rem; min-height: 60vh;';

      if (cart.length === 0) {
        main.innerHTML = `
          <div style="max-width:600px;margin:4rem auto;text-align:center;padding:2rem">
            <div style="font-size:5rem;margin-bottom:1rem">🛒</div>
            <h1 style="font-size:2rem;font-weight:700;margin-bottom:0.5rem">Your Cart is Empty</h1>
            <p style="color:var(--muted-foreground,#888);margin-bottom:1.5rem">Looks like you haven't added anything yet.</p>
            <a href="/shop" style="display:inline-block;background:#ea580c;color:#fff;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;transition:background 0.2s">Start Shopping →</a>
          </div>`;
        return;
      }

      main.innerHTML = `
        <div style="max-width:1100px;margin:0 auto">
          <h1 style="font-size:2.2rem;font-weight:700;margin-bottom:0.5rem;text-align:center">Your Cart</h1>
          <p style="text-align:center;color:#888;margin-bottom:2rem">Review your items and proceed to secure checkout.</p>
          <div id="mv-cart-layout" style="display:grid;grid-template-columns:1fr 340px;gap:2rem">
            <div id="mv-cart-items"></div>
            <div id="mv-cart-summary"></div>
          </div>
        </div>`;

      const itemsEl = document.getElementById('mv-cart-items');
      const summaryEl = document.getElementById('mv-cart-summary');

      function renderItems() {
        const c = getCart();
        itemsEl.innerHTML = c.map(item => `
          <div data-id="${item.id}" style="display:flex;align-items:center;gap:1rem;padding:1rem;border:1px solid var(--border,#e5e7eb);border-radius:12px;margin-bottom:1rem;background:var(--card,#fff)">
            <img src="${item.image}" alt="${item.name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;flex-shrink:0" onerror="this.src='/images/hero-mushroom.webp'">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:1rem;margin-bottom:0.25rem">${item.name}</div>
              <div style="color:#ea580c;font-weight:700">₹${item.price.toFixed(2)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem">
              <button data-action="dec" data-id="${item.id}" style="width:32px;height:32px;border:1px solid #e5e7eb;border-radius:6px;background:#f9f9f9;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center">−</button>
              <span style="min-width:24px;text-align:center;font-weight:600">${item.quantity}</span>
              <button data-action="inc" data-id="${item.id}" style="width:32px;height:32px;border:1px solid #e5e7eb;border-radius:6px;background:#f9f9f9;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center">+</button>
              <button data-action="rm" data-id="${item.id}" style="width:32px;height:32px;border:none;border-radius:6px;background:#fee2e2;cursor:pointer;color:#dc2626;font-size:1rem">✕</button>
            </div>
            <div style="min-width:80px;text-align:right;font-weight:700">₹${(item.price * item.quantity).toFixed(2)}</div>
          </div>`).join('') +
          `<button id="mv-clear-cart" style="background:none;border:1px solid #e5e7eb;color:#888;padding:0.5rem 1.2rem;border-radius:8px;cursor:pointer;font-size:0.875rem;margin-top:0.5rem">Clear Cart</button>`;

        // Bind events
        itemsEl.querySelectorAll('button[data-action]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            const currentItem = getCart().find(i => i.id === id);
            if (!currentItem) return;
            if (action === 'inc') updateQty(id, currentItem.quantity + 1);
            else if (action === 'dec') updateQty(id, currentItem.quantity - 1);
            else if (action === 'rm') { removeFromCart(id); showToast('Item removed from cart', 'remove'); }
            renderItems();
            renderSummary();
          });
        });
        document.getElementById('mv-clear-cart')?.addEventListener('click', () => {
          clearCart(); showToast('Cart cleared', 'info'); renderCart();
        });
      }

      function renderSummary() {
        const c = getCart();
        const sub = getCartTotal(c);
        const ship = sub > 0 ? 50 : 0;
        const hand = sub > 0 ? 25 : 0;
        const tot = sub + ship + hand;
        summaryEl.innerHTML = `
          <div style="border:1px solid var(--border,#e5e7eb);border-radius:12px;background:var(--card,#fff);padding:1.5rem;position:sticky;top:80px">
            <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem">Order Summary</h2>
            <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem"><span>Subtotal</span><span>₹${sub.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem"><span>Shipping</span><span>₹${ship.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem"><span>Convenience Fee</span><span>₹${hand.toFixed(2)}</span></div>
            <div style="border-top:1px solid #e5e7eb;margin:0.75rem 0"></div>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.1rem;margin-bottom:1.5rem"><span>Total</span><span style="color:#ea580c">₹${tot.toFixed(2)}</span></div>
            <a href="/checkout" style="display:block;width:100%;text-align:center;background:#ea580c;color:#fff;padding:0.875rem;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;transition:background 0.2s" onmouseover="this.style.background='#c2410c'" onmouseout="this.style.background='#ea580c'">Proceed to Checkout →</a>
          </div>`;
      }

      renderItems();
      renderSummary();

      // Responsive layout fix
      if (window.innerWidth < 768) {
        document.getElementById('mv-cart-layout').style.gridTemplateColumns = '1fr';
      }
    }

    // Run after React renders (small delay)
    setTimeout(renderCart, 300);
  }

  /* ============================================
     FIX SECTION IMAGES (picsum → local static)
  ============================================ */
  function fixSectionImages() {
    // Replace all remaining picsum image srcs in <img> tags with local images
    const imageMappings = [
      { pattern: 'picsum.photos/600/500', replacement: '/images/hero-mushroom.webp' },  // About page
      { pattern: 'picsum.photos/600/400', replacement: '/images/hero-mushroom.webp' },  // Contact page
      { pattern: 'picsum.photos/1200/400', replacement: '/images/hero-mushroom.webp' }, // Education page
      { pattern: 'picsum.photos/600/600', replacement: '/images/hero-mushroom.webp'},   // Generic
      // Clean up any /_next/image encoded versions
      { pattern: '/_next/image?url=%2Fimages%2Fhero-mushroom.webp', replacement: '/images/hero-mushroom.webp', isFullSrc: true },
    ];

    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.getAttribute('src') || '';
      const srcset = img.getAttribute('srcSet') || img.getAttribute('srcset') || '';

      for (const m of imageMappings) {
        if (src.includes(m.pattern) || srcset.includes(m.pattern)) {
          img.src = m.replacement;
          img.removeAttribute('srcSet');
          img.removeAttribute('srcset');
          // Also fix the parent container if it uses background-image
          img.style.objectFit = 'cover';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.position = img.style.position || 'static';
          break;
        }
      }

      // Fix srcSet that leads to /_next/image
      if (srcset && srcset.includes('/_next/image')) {
        img.removeAttribute('srcSet');
        img.removeAttribute('srcset');
        if (!img.src || img.src.includes('/_next/image')) {
          img.src = '/images/hero-mushroom.webp';
        }
      }
    });
  }

  /* ============================================
     LINK INTERCEPT (transition loader)
  ============================================ */
  function interceptLinks() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel')) return;
      showLoader();
    });
  }

  /* ============================================
     INIT
  ============================================ */
  function init() {
    createLoader();
    createOfflineScreen();

    // Hide loader on page ready
    if (document.readyState === 'complete') hideLoader();
    else window.addEventListener('load', hideLoader);

    // Offline
    window.addEventListener('offline', checkOnline);
    window.addEventListener('online', checkOnline);
    checkOnline();

    // Cart badge
    updateCartBadge();
    window.addEventListener('storage', updateCartBadge);

    // Fix section images immediately and after React hydration
    fixSectionImages();
    setTimeout(fixSectionImages, 500);
    setTimeout(fixSectionImages, 1500);

    // Cart page
    renderCartPage();

    // Add to cart buttons
    watchForButtons();

    // Link transitions
    interceptLinks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
