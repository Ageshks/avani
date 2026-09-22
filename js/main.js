/* ============================================================
   AVANI JEWELS — main.js
   Vanilla JS only. No dependencies (besides the Bootstrap bundle).
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   1. GLOBAL CONFIG — the client only needs to edit these values.
   Replace the placeholder WhatsApp number with the real one
   (country code, no "+", no spaces).
   ------------------------------------------------------------ */
const AVANI = {
  whatsappNumber: '919876543210', // e.g. '919876543210'
  whatsappDefaultMsg: 'Hello Avani Jewels! I would like to know more about your jewellery collections.',
};

/* Tiny helpers */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ------------------------------------------------------------
   2. STICKY NAVBAR — transparent over the hero, solid on scroll.
   ------------------------------------------------------------ */
(function initHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Keep the header readable while the mobile menu is open,
     and close the menu automatically after choosing a page. */
  const nav = document.getElementById('mainNav');
  if (nav && window.bootstrap) {
    nav.addEventListener('show.bs.collapse', () => header.classList.add('menu-open'));
    nav.addEventListener('hidden.bs.collapse', () => header.classList.remove('menu-open'));

    $$('.nav-link', nav).forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992) {
          bootstrap.Collapse.getOrCreateInstance(nav).hide();
        }
      });
    });
  }
})();

/* ------------------------------------------------------------
   3. WHATSAPP LINKS — every element with .js-whatsapp gets its
   href built from AVANI.whatsappNumber. A custom message can be
   set via data-whatsapp-msg="..." on the element.
   ------------------------------------------------------------ */
(function initWhatsAppLinks() {
  $$('.js-whatsapp').forEach((a) => {
    const msg = a.dataset.whatsappMsg || AVANI.whatsappDefaultMsg;
    a.setAttribute('href', `https://wa.me/${AVANI.whatsappNumber}?text=${encodeURIComponent(msg)}`);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
})();

/* ------------------------------------------------------------
   4. SCROLL REVEAL — elements with .reveal fade in once.
   Optional stagger via .rv-d1 … .rv-d4.
   ------------------------------------------------------------ */
(function initReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => io.observe(el));
})();

/* ------------------------------------------------------------
   5. FOOTER YEAR — keeps the copyright year current.
   ------------------------------------------------------------ */
(function initYear() {
  $$('.js-year').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

/* ------------------------------------------------------------
   6. WISHLIST — hearts on product cards persist in localStorage
   and update the counter badge + wishlist modal.
   ------------------------------------------------------------ */
const Wishlist = (function initWishlist() {
  const KEY = 'avani_wishlist_v1';
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (err) { items = []; }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (err) { /* private mode */ } };
  const has = (id) => items.some((i) => i.id === id);

  function render() {
    const badge = document.getElementById('wishCount');

    if (badge) {
      badge.textContent = String(items.length);
      badge.hidden = items.length === 0;
    }

    /* Sync every heart button with the stored state */
    $$('.wishlist-btn').forEach((btn) => {
      const active = has(btn.dataset.wish);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      const icon = btn.querySelector('i');
      if (icon) icon.className = active ? 'bi bi-heart-fill' : 'bi bi-heart';
    });

    /* Rebuild the wishlist modal list */
    const listEl = document.getElementById('wishListItems');
    const emptyEl = document.getElementById('wishListEmpty');
    if (listEl) {
      listEl.innerHTML = items.map((i) => `
        <li class="wish-item">
          <div>
            <p class="wish-name">${i.name}</p>
            <p class="wish-price">${i.price || ''}</p>
          </div>
          <button type="button" class="wish-remove" data-remove="${i.id}" aria-label="Remove ${i.name} from wishlist">
            <i class="bi bi-x-lg"></i>
          </button>
        </li>`).join('');
      if (emptyEl) emptyEl.hidden = items.length > 0;
    }
  }

  function toggle(btn) {
    const id = btn.dataset.wish;
    const name = btn.dataset.wishName || id;
    const price = btn.dataset.wishPrice || '';
    if (has(id)) {
      items = items.filter((i) => i.id !== id);
    } else {
      items.push({ id, name, price });
    }
    save();
    render();
  }

  document.addEventListener('click', (e) => {
    const heart = e.target.closest('.wishlist-btn');
    if (heart) { toggle(heart); return; }
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      items = items.filter((i) => i.id !== removeBtn.dataset.remove);
      save();
      render();
    }
  });

  render();
  return { get items() { return items.slice(); } };
})();

/* ------------------------------------------------------------
   7. PRODUCT GALLERY (product.html) — thumbnails swap the main
   image with a soft cross-fade.
   ------------------------------------------------------------ */
(function initProductGallery() {
  const main = document.getElementById('pdMainImage');
  const thumbs = $$('.pd-thumb');
  if (!main || !thumbs.length) return;

  main.style.transition = 'opacity 0.45s ease';

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      thumb.classList.add('active');
      thumb.setAttribute('aria-selected', 'true');

      main.style.opacity = '0';
      setTimeout(() => {
        main.src = thumb.dataset.image;
        main.alt = thumb.dataset.alt || main.alt;
        main.style.opacity = '1';
      }, 220);
    });
  });
})();

/* ------------------------------------------------------------
   8. PRODUCT WHATSAPP ENQUIRY — builds a message that includes
   the product name (product.html).
   ------------------------------------------------------------ */
(function initProductEnquiry() {
  const btn = document.querySelector('.js-whatsapp-product');
  if (!btn) return;
  const name = btn.dataset.productName || document.querySelector('.pd-title')?.textContent.trim() || 'a piece from your collection';
  const code = btn.dataset.productCode || '';
  const msg = `Hello Avani Jewels! I would like to enquire about "${name}"${code ? ` (Product code: ${code})` : ''}.`;
  btn.setAttribute('href', `https://wa.me/${AVANI.whatsappNumber}?text=${encodeURIComponent(msg)}`);
  btn.setAttribute('target', '_blank');
  btn.setAttribute('rel', 'noopener');
})();

/* ------------------------------------------------------------
   9. CONTACT FORM (contact.html) — Bootstrap validation with an
   elegant success message. Wire up a real backend when available.
   ------------------------------------------------------------ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    form.classList.remove('was-validated');
    form.reset();

    const success = document.getElementById('formSuccess');
    if (success) {
      success.classList.remove('d-none');
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => success.classList.add('d-none'), 9000);
    }
  });
})();

/* ------------------------------------------------------------
   10. SEARCH MODAL — focus the input when the modal opens.
   ------------------------------------------------------------ */
document.addEventListener('shown.bs.modal', (e) => {
  if (e.target && e.target.id === 'searchModal') {
    const input = document.getElementById('searchInput');
    if (input) setTimeout(() => input.focus(), 250);
  }
});


