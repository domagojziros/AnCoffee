const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');
const heroParticles = document.getElementById('heroParticles');
const animatedElements = document.querySelectorAll('[data-animate]');
const statsItems = document.querySelectorAll('.stat-item');
const galleryItems = document.querySelectorAll('.gallery-img');
const currentYear = document.getElementById('year');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const safeText = (text) => text ? String(text) : '';

let navStatePushed = false;

const toggleNavigation = () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';

  if (!expanded) {
    navToggle.setAttribute('aria-expanded', 'true');
    navMenu.classList.add('is-open');
    try {
      history.pushState({ navOpen: true }, '');
      navStatePushed = true;
    } catch (e) {
      navStatePushed = false;
    }
  } else {
    closeNavigation(true);
  }
};

const closeNavigation = (shouldPopHistory = false) => {
  if (!navMenu.classList.contains('is-open')) return;
  navToggle.setAttribute('aria-expanded', 'false');
  navMenu.classList.remove('is-open');

  if (shouldPopHistory && navStatePushed) {
    try { history.back(); } catch (e) { /* ignore */ }
  }

  navStatePushed = false;
};

const handleNavLinkClick = (event) => {
  const isHashLink = event.currentTarget.hash && event.currentTarget.pathname === window.location.pathname;

  if (window.innerWidth <= 900) {
    if (navStatePushed && isHashLink) {
      try { history.replaceState(null, '', window.location.href); } catch (e) { /* ignore */ }
      navStatePushed = false;
    }
    closeNavigation();
    navToggle.focus();
  }
};

const handleScroll = () => {
  const offset = window.scrollY;
  navbar.classList.toggle('scrolled', offset > 24);
  backToTop.classList.toggle('visible', offset > window.innerHeight * 0.5);
};

const animateStats = (entry) => {
  if (!entry.isIntersecting) return;

  statsItems.forEach((item) => {
    const valueElement = item.querySelector('.stat-number');
    if (!valueElement || valueElement.dataset.animated) return;

    const target = Number(valueElement.dataset.count || 0);
    const suffix = item.querySelector('.stat-suffix')?.textContent || '';
    const start = performance.now();
    const duration = 1200;

    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const current = Math.floor(progress * target);
      valueElement.textContent = `${current}`;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        valueElement.textContent = `${target}`;
      }
    };

    valueElement.dataset.animated = 'true';
    window.requestAnimationFrame(step);
  });
};

const loadGalleryImage = (container) => {
  const imgSrc = container.dataset.src;
  if (!imgSrc || container.dataset.loaded) return;

  const parent = container.closest('.gallery-item');
  const caption = parent?.querySelector('.gallery-caption span')?.textContent || 'Galerija';
  const image = document.createElement('img');
  image.loading = 'lazy';
  image.decoding = 'async';
  image.alt = safeText(caption);
  image.src = imgSrc;
  image.addEventListener('error', () => {
    image.remove();
  });

  container.appendChild(image);
  container.dataset.loaded = 'true';
};

const observeAnimations = () => {
  if (prefersReducedMotion) {
    animatedElements.forEach((element) => {
      element.classList.add('is-visible');
    });
    statsItems.forEach((item) => {
      const number = item.querySelector('.stat-number');
      if (number) {
        number.textContent = number.dataset.count || '0';
      }
    });
    galleryItems.forEach(loadGalleryImage);
    return;
  }

  const observerOptions = {
    threshold: 0.2,
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (entry.target.dataset.animate === 'fade-up' || entry.target.dataset.animate === 'fade-left' || entry.target.dataset.animate === 'fade-right') {
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach((element) => revealObserver.observe(element));

  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateStats(entry);
      observer.unobserve(entry.target);
    });
  }, observerOptions);

  statsItems.forEach((item) => statsObserver.observe(item));

  const galleryObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadGalleryImage(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '120px 0px', threshold: 0.1 });

  galleryItems.forEach((container) => galleryObserver.observe(container));
};

const createHeroParticles = () => {
  if (!heroParticles) return;

  const particleCount = 14;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'particle';
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = (Math.random() * 8).toFixed(2);
    const duration = 6 + Math.random() * 8;
    particle.style.left = `${left}%`;
    particle.style.top = `${top}%`;
    particle.style.setProperty('--delay', `${delay}s`);
    particle.style.setProperty('--dur', `${duration}s`);
    fragment.appendChild(particle);
  }

  heroParticles.appendChild(fragment);
};

const handleEscape = (event) => {
  if (event.key === 'Escape' && navMenu.classList.contains('is-open')) {
    closeNavigation();
    navToggle.focus();
  }
};

// Close nav when browser back/forward is used
window.addEventListener('popstate', (e) => {
  if (navMenu && navMenu.classList.contains('is-open')) {
    closeNavigation();
  }
});

// Close nav when clicking outside on mobile
document.addEventListener('click', (e) => {
  if (!navMenu || !navToggle) return;
  const isClickInside = navMenu.contains(e.target) || navToggle.contains(e.target);
  if (!isClickInside && navMenu.classList.contains('is-open')) {
    closeNavigation();
  }
});

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const setYear = () => {
  if (!currentYear) return;
  currentYear.textContent = new Date().getFullYear();
};

const init = () => {
  setYear();
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', toggleNavigation);
    navToggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleNavigation();
      }
    });
  }

  navLinks.forEach((link) => link.addEventListener('click', handleNavLinkClick));

  if (backToTop) {
    backToTop.addEventListener('click', scrollToTop);
  }

  window.addEventListener('scroll', () => {
    window.requestAnimationFrame(handleScroll);
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navMenu.classList.contains('is-open')) {
      closeNavigation();
    }
  });

  window.addEventListener('keydown', handleEscape);
  observeAnimations();
  createHeroParticles();
  handleScroll();
};

document.addEventListener('DOMContentLoaded', init);
