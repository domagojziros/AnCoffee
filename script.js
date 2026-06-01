/**
 * An Coffee — script.js
 * Navbar + right-side drawer (klizi s desna na lijevo), full keyboard/focus management,
 * scroll-lock, staggered link entrance, rAF scroll throttle, eased stats counter.
 */

/* ─── Selectors ────────────────────────────────────────────── */
const navbar         = document.getElementById('navbar');
const navToggle      = document.getElementById('navToggle');
const navDrawer      = document.getElementById('navDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerClose    = document.getElementById('drawerClose');
const drawerLinks    = document.querySelectorAll('.drawer-link');
const desktopLinks   = document.querySelectorAll('.desktop-link');
const backToTop      = document.getElementById('backToTop');
const heroParticles  = document.getElementById('heroParticles');
const statsItems     = document.querySelectorAll('.stat-item');
const galleryItems   = document.querySelectorAll('.gallery-img');
const animatedEls    = document.querySelectorAll('[data-animate]');
const yearEl         = document.getElementById('year');

const BREAKPOINT           = 900;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Drawer state ─────────────────────────────────────────── */
let drawerOpen = false;

const openDrawer = () => {
  if (drawerOpen) return;
  drawerOpen = true;

  navToggle.setAttribute('aria-expanded', 'true');
  navDrawer.setAttribute('aria-hidden', 'false');
  navDrawer.classList.add('is-open');
  drawerBackdrop.classList.add('is-visible');

  // Scroll-lock body
  document.body.style.overflow = 'hidden';

  // Stagger drawer links entrance
  drawerLinks.forEach((link, i) => {
    link.style.transitionDelay = `${80 + i * 70}ms`;
  });

  // Move focus into drawer so screen-readers announce it
  requestAnimationFrame(() => {
    const firstLink = navDrawer.querySelector('.drawer-link');
    if (firstLink) firstLink.focus();
  });
};

const closeDrawer = (returnFocus = true) => {
  if (!drawerOpen) return;
  drawerOpen = false;

  navToggle.setAttribute('aria-expanded', 'false');
  navDrawer.setAttribute('aria-hidden', 'true');
  navDrawer.classList.remove('is-open');
  drawerBackdrop.classList.remove('is-visible');

  document.body.style.overflow = '';

  // Reset stagger delays so re-open animates again
  drawerLinks.forEach(link => { link.style.transitionDelay = '0ms'; });

  if (returnFocus) navToggle.focus();
};

/* Focus trap inside drawer */
const trapFocus = (e) => {
  if (!drawerOpen) return;
  const focusable = Array.from(
    navDrawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
};

/* ─── Scroll handler (rAF-throttled) ──────────────────────── */
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    navbar?.classList.toggle('scrolled', y > 24);
    backToTop?.classList.toggle('visible', y > window.innerHeight * 0.5);
    ticking = false;
  });
};

/* ─── Stats counter ────────────────────────────────────────── */
const easeOutQuart = t => 1 - (1 - t) ** 4;

const animateStats = () => {
  statsItems.forEach(item => {
    const el = item.querySelector('.stat-number');
    if (!el || el.dataset.animated) return;
    el.dataset.animated = 'true';
    const target   = Number(el.dataset.count ?? 0);
    const start    = performance.now();
    const duration = 1400;
    const step = now => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.floor(easeOutQuart(p) * target));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    };
    requestAnimationFrame(step);
  });
};

/* ─── Lazy gallery ─────────────────────────────────────────── */
const loadGalleryImage = (container) => {
  const src = container.dataset.src;
  if (!src || container.dataset.loaded) return;
  const caption = container.closest('.gallery-item')
    ?.querySelector('.gallery-caption span')?.textContent ?? 'Galerija';
  const img    = new Image();
  img.loading  = 'lazy';
  img.decoding = 'async';
  img.alt      = caption;
  img.onerror  = () => img.remove();
  img.src      = src;
  container.appendChild(img);
  container.dataset.loaded = 'true';
};

/* ─── IntersectionObservers ────────────────────────────────── */
const setupObservers = () => {
  if (prefersReducedMotion) {
    animatedEls.forEach(el => el.classList.add('is-visible'));
    statsItems.forEach(item => {
      const n = item.querySelector('.stat-number');
      if (n) n.textContent = n.dataset.count ?? '0';
    });
    galleryItems.forEach(loadGalleryImage);
    return;
  }

  const opts = { threshold: 0.2 };

  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (['fade-up','fade-left','fade-right'].includes(entry.target.dataset.animate)) {
        obs.unobserve(entry.target);
      }
    });
  }, opts);
  animatedEls.forEach(el => revealObs.observe(el));

  const statsObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateStats();
      obs.unobserve(entry.target);
    });
  }, opts);
  statsItems.forEach(item => statsObs.observe(item));

  const galleryObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      loadGalleryImage(entry.target);
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '120px 0px', threshold: 0.1 });
  galleryItems.forEach(c => galleryObs.observe(c));
};

/* ─── Hero particles ───────────────────────────────────────── */
const createParticles = () => {
  if (!heroParticles || prefersReducedMotion) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.className = 'particle';
    s.style.cssText = `left:${(Math.random()*96).toFixed(1)}%;top:${(Math.random()*96).toFixed(1)}%;--delay:${(Math.random()*8).toFixed(2)}s;--dur:${(6+Math.random()*8).toFixed(2)}s`;
    frag.appendChild(s);
  }
  heroParticles.appendChild(frag);
};

/* ─── Init ─────────────────────────────────────────────────── */
const init = () => {
  // Year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Particles + observers
  createParticles();
  setupObservers();
  onScroll();

  // Hamburger toggle
  navToggle?.addEventListener('click', () => drawerOpen ? closeDrawer() : openDrawer());

  // Backdrop click closes drawer
  drawerBackdrop?.addEventListener('click', () => closeDrawer());

  // Drawer links close drawer on click
  drawerLinks.forEach(link => link.addEventListener('click', () => closeDrawer(false)));

  // Desktop links — no drawer involvement
  desktopLinks.forEach(link => link.addEventListener('click', () => {
    if (window.innerWidth <= BREAKPOINT) closeDrawer(false);
  }));

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawerOpen) closeDrawer();
    trapFocus(e);
  });

  // Resize: close drawer if viewport widens past breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > BREAKPOINT && drawerOpen) closeDrawer(false);
  }, { passive: true });

  // Scroll
  window.addEventListener('scroll', onScroll, { passive: true });

  // Back to top
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
};

document.addEventListener('DOMContentLoaded', init);