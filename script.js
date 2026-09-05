/* ==========================================================
   NM MÓVEIS — script.js (partilhado por todas as páginas)
   ========================================================== */
/* ---------- Transição suave entre páginas ----------
   A entrada é 100% CSS (ver @keyframes bodyIn) — funciona mesmo sem JS.
   Isto aqui só acrescenta a saída suave antes de navegar. */
document.addEventListener('click', (e) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  const isInternalPage = href && /^[a-z0-9_-]+\.html(#.*)?$/i.test(href);
  if (!isInternalPage || link.target === '_blank') return;

  e.preventDefault();
  document.body.classList.add('page-leaving');
  window.setTimeout(() => { window.location.href = href; }, 300);
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.body.classList.remove('page-leaving');
});

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Título dividido em palavras (entrada em cascata) ---------- */
  document.querySelectorAll('.split-title').forEach(title => {
    const words = title.textContent.trim().split(/\s+/);
    title.innerHTML = words
      .map((word, i) => `<span class="word"><span style="animation-delay:${0.32 + i * 0.07}s">${word}</span></span>`)
      .join(' ');
  });

  /* Ano no footer */
  document.querySelectorAll('#year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Header: fundo ao fazer scroll ---------- */
  const header = document.getElementById('site-header');

  if (header) {
    const isOverlay = header.classList.contains('overlay');
    const onScroll = () => {
      if (isOverlay) {
        header.classList.toggle('scrolled', window.scrollY > 60);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Menu hamburger (mobile) ---------- */
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');

    const closeMenu = () => {
      header.classList.remove('nav-open');
      if (menuToggle) {
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    };

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        const isOpen = header.classList.toggle('nav-open');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    if (mainNav) {
      mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    }

    /* ---------- Link activo consoante a página actual ---------- */
    const here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach(link => {
      const target = link.getAttribute('href');
      if (target === here) link.classList.add('active');
    });
  }

  /* ---------- Barra de progresso do scroll ---------- */
  const progress = document.getElementById('scroll-progress');
  if (progress) {
    const updateProgress = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      progress.style.width = max > 0 ? `${(scrolled / max) * 100}%` : '0%';
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }

  /* ---------- Reveal ao entrar na tela (scroll), em cascata por grupo ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  /* elementos que partilham o mesmo pai animam em cascata (--stagger),
     até um máximo de 6 posições para não atrasar demasiado listas longas */
  const groups = new Map();
  revealEls.forEach(el => {
    const parent = el.parentElement;
    const index = groups.get(parent) || 0;
    el.style.setProperty('--stagger', Math.min(index, 6));
    groups.set(parent, index + 1);
  });

  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- Números animados ---------- */
  const counters = document.querySelectorAll('.counter-value');
  if ('IntersectionObserver' in window && counters.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        countObserver.unobserve(el);
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const numberEl = el.querySelector('.counter-number');
        if (prefersReducedMotion) { numberEl.textContent = target; return; }
        const duration = 1200;
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          numberEl.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => countObserver.observe(el));
  } else {
    counters.forEach(el => {
      const numberEl = el.querySelector('.counter-number');
      if (numberEl) numberEl.textContent = el.getAttribute('data-count');
    });
  }

  /* ---------- Botão voltar ao topo ---------- */
  const toTop = document.getElementById('to-top');
  if (toTop) {
    const toggleToTop = () => toTop.classList.toggle('visible', window.scrollY > 700);
    toggleToTop();
    window.addEventListener('scroll', toggleToTop, { passive: true });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Parallax subtil nos heros das páginas internas ---------- */
  if (!prefersReducedMotion) {
    const parallaxImgs = document.querySelectorAll('.page-hero img, .contact-cta img');
    if (parallaxImgs.length) {
      const applyParallax = () => {
        parallaxImgs.forEach(img => {
          const rect = img.parentElement.getBoundingClientRect();
          const progress = 1 - Math.min(Math.max(rect.top / window.innerHeight, -1), 1);
          img.style.transform = `translateY(${(progress - 0.5) * 40}px) scale(1.12)`;
        });
      };
      applyParallax();
      window.addEventListener('scroll', applyParallax, { passive: true });
      window.addEventListener('resize', applyParallax);
    }
  }

  /* ---------- Botões magnéticos ---------- */
  if (!prefersReducedMotion && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn-primary').forEach(btn => {
      btn.classList.add('magnetic');
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const mx = (e.clientX - rect.left - rect.width / 2) * 0.35;
        const my = (e.clientY - rect.top - rect.height / 2) * 0.5;
        btn.style.setProperty('--mx', `${mx}px`);
        btn.style.setProperty('--my', `${my}px`);
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------- Painéis da Início: imagem segue o rato ---------- */
  if (!prefersReducedMotion && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.panel').forEach(panel => {
      const img = panel.querySelector('img');
      if (!img) return;
      panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        img.style.transform = `translate(${px * -18}px, ${py * -18}px) scale(1.08)`;
      });
      panel.addEventListener('mouseleave', () => { img.style.transform = ''; });
    });
  }

  /* ---------- Vitrine interativa (arrastar + setas) ---------- */
  const showcaseTrack = document.querySelector('.showcase-track');
  if (showcaseTrack) {
    const prevBtn = document.querySelector('.showcase-prev');
    const nextBtn = document.querySelector('.showcase-next');
    const cardWidth = () => showcaseTrack.querySelector('.showcase-card')?.offsetWidth + 22 || 300;

    if (prevBtn) prevBtn.addEventListener('click', () => showcaseTrack.scrollBy({ left: -cardWidth(), behavior: 'smooth' }));
    if (nextBtn) nextBtn.addEventListener('click', () => showcaseTrack.scrollBy({ left: cardWidth(), behavior: 'smooth' }));

    let isDown = false, startX = 0, startScroll = 0, moved = false;
    const startDrag = (x) => { isDown = true; moved = false; startX = x; startScroll = showcaseTrack.scrollLeft; showcaseTrack.classList.add('dragging'); };
    const moveDrag = (x) => { if (!isDown) return; const dx = x - startX; if (Math.abs(dx) > 5) moved = true; showcaseTrack.scrollLeft = startScroll - dx; };
    const endDrag = () => { isDown = false; showcaseTrack.classList.remove('dragging'); };

    showcaseTrack.addEventListener('mousedown', (e) => startDrag(e.clientX));
    window.addEventListener('mousemove', (e) => moveDrag(e.clientX));
    window.addEventListener('mouseup', endDrag);
    showcaseTrack.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX), { passive: true });
    showcaseTrack.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX), { passive: true });
    showcaseTrack.addEventListener('touchend', endDrag);

    /* impede que um arrasto termine como clique acidental na foto */
    showcaseTrack.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', (e) => { if (moved) e.preventDefault(); });
    });
  }

  /* ---------- Filtro da galeria (página Projetos) ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      galleryItems.forEach(item => {
        const show = cat === 'todos' || item.getAttribute('data-category') === cat;
        item.hidden = !show;
      });
    });
  });

  /* ---------- Lightbox da galeria de projetos ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  let currentIndex = -1;
  const lightboxFigure = document.querySelector('.lightbox-figure');

  const visibleItems = () => galleryItems.filter(item => !item.hidden);

  const showAt = (index, animate) => {
    const items = visibleItems();
    if (!items.length) return;
    currentIndex = (index + items.length) % items.length;
    const item = items[currentIndex];
    const full = item.getAttribute('data-full');
    const caption = item.getAttribute('data-caption') || '';

    const apply = () => {
      lightboxImage.setAttribute('src', full);
      lightboxImage.setAttribute('alt', caption);
      lightboxCaption.textContent = caption;
      if (animate && lightboxFigure) {
        requestAnimationFrame(() => lightboxFigure.classList.remove('swapping'));
      }
    };

    if (animate && lightboxFigure) {
      lightboxFigure.classList.add('swapping');
      window.setTimeout(apply, 160);
    } else {
      apply();
    }
  };

  const openLightbox = (index) => {
    if (!lightbox) return;
    showAt(index);
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const index = visibleItems().indexOf(item);
      openLightbox(index);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => showAt(currentIndex - 1, true));
  if (lightboxNext) lightboxNext.addEventListener('click', () => showAt(currentIndex + 1, true));

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showAt(currentIndex - 1, true);
    if (e.key === 'ArrowRight') showAt(currentIndex + 1, true);
  });

});
