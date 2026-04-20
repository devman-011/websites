/* =========================================================
   Ashmont — landing page motion
   ========================================================= */

gsap.registerPlugin(ScrollTrigger);

const isMobile = matchMedia('(max-width: 900px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// When ?record=1 is in the URL, we're being captured headlessly.
// Disable heavyweight JS effects so Chromium can render frames on time.
const RECORD_MODE = new URLSearchParams(location.search).has('record');
if (RECORD_MODE) document.documentElement.classList.add('is-recording');

/* ---------- Page curtain + first paint ---------- */
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    document.body.classList.remove('no-scroll-yet');
    const curtain = document.querySelector('.curtain');
    setTimeout(() => curtain.classList.add('is-done'), 900);
    setTimeout(() => curtain.remove(), 2200);
    document.querySelectorAll('.hero [data-reveal], .hero [data-reveal-stagger]').forEach(el => el.classList.add('is-inview'));
  });
});

/* ---------- Smooth scroll (Lenis + GSAP bridge) ---------- */
let lenis = null;
if (!reduceMotion && !RECORD_MODE) {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.2,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Hide nav on scroll down, show on scroll up ---------- */
const nav = document.querySelector('.nav');
let lastY = 0;
function navVisibility() {
  const y = window.scrollY;
  if (y > lastY && y > 200) nav.classList.add('is-hidden');
  else nav.classList.remove('is-hidden');
  lastY = y;
}
window.addEventListener('scroll', navVisibility, { passive: true });

/* ---------- Reveal on scroll (IntersectionObserver) ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-inview');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(el => io.observe(el));

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll('[data-magnetic]').forEach(el => {
  if (reduceMotion || RECORD_MODE) return;
  const strengthX = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
  const strengthY = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    strengthX(mx * 0.25);
    strengthY(my * 0.35);
  });
  el.addEventListener('mouseleave', () => {
    strengthX(0);
    strengthY(0);
  });
});

/* ---------- Tilt on practitioner cards ---------- */
document.querySelectorAll('[data-tilt]').forEach(el => {
  if (reduceMotion || isMobile || RECORD_MODE) return;
  const portrait = el.querySelector('.prac__portrait');
  if (!portrait) return;
  const rx = gsap.quickTo(portrait, 'rotationX', { duration: 0.5, ease: 'power3.out' });
  const ry = gsap.quickTo(portrait, 'rotationY', { duration: 0.5, ease: 'power3.out' });
  gsap.set(portrait, { transformPerspective: 900, transformOrigin: 'center' });
  el.addEventListener('mousemove', (e) => {
    const r = portrait.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    rx(ny * -6);
    ry(nx * 6);
  });
  el.addEventListener('mouseleave', () => { rx(0); ry(0); });
});

/* ---------- Mobile menu ---------- */
const burger = document.querySelector('.nav__burger');
const menu = document.querySelector('.menu');
burger?.addEventListener('click', () => {
  const open = burger.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  document.body.style.overflow = open ? 'hidden' : '';
});
menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => burger.click()));

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq__item').forEach(item => {
  const btn = item.querySelector('.faq__q');
  btn.addEventListener('click', () => {
    const open = item.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
});

/* ---------- Typewriter tile ---------- */
const twPhrases = [
  'Type 2 diabetes',
  'thyroid disorders',
  'hypertension management',
  'gestational diabetes',
  'PCOS support',
  'prediabetes reversal',
  'anaemia & fatigue',
  'custom diet plans',
];
const twEl = document.getElementById('twText');
let twI = 0;

function typewriterLoop() {
  if (!twEl) return;
  const next = twPhrases[twI % twPhrases.length];
  const current = twEl.textContent;
  // erase
  let i = current.length;
  const erase = setInterval(() => {
    twEl.textContent = current.slice(0, --i);
    if (i <= 0) {
      clearInterval(erase);
      // type
      let j = 0;
      const type = setInterval(() => {
        twEl.textContent = next.slice(0, ++j);
        if (j >= next.length) {
          clearInterval(type);
          twI++;
          setTimeout(typewriterLoop, 2200);
        }
      }, 45);
    }
  }, 28);
}
setTimeout(typewriterLoop, 1800);

/* ---------- Counter animation (runs once in view) ---------- */
const counterEl = document.getElementById('counter');
if (counterEl) {
  const target = parseInt(counterEl.dataset.target, 10) || 0;
  const co = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      co.disconnect();
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2.4,
        ease: 'power3.out',
        onUpdate: () => {
          counterEl.textContent = Math.floor(obj.v).toLocaleString('en-GB');
        }
      });
    }
  }, { threshold: 0.4 });
  co.observe(counterEl);
}

/* ---------- (Schedule tile removed — not used in this template) ---------- */

/* ---------- Journey: autoplay video + scroll-sequenced beats ---------- */
const journeyVideo = document.getElementById('journeyVideo');
const journeySection = document.querySelector('.journey');
const beats = document.querySelectorAll('.journey__beat');
const progressBar = document.getElementById('journeyBar');

if (journeyVideo) {
  journeyVideo.play().catch(() => {});
}

if (journeySection && beats.length && !isMobile) {
  beats.forEach(b => {
    b.style.opacity = '0';
    b.style.transform = 'translate(-50%, -50%) translateY(30px)';
  });

  ScrollTrigger.create({
    trigger: journeySection,
    start: 'top top',
    end: 'bottom bottom',
    scrub: RECORD_MODE ? true : 0.6,
    onUpdate: (self) => {
      const p = self.progress;
      if (progressBar) progressBar.parentElement.style.setProperty('--p', String(p));

      const n = beats.length;
      beats.forEach((b, i) => {
        const segStart = i / n;
        const segEnd = (i + 1) / n;
        const fadeIn = segStart;
        const fullIn = segStart + (segEnd - segStart) * 0.15;
        const fullOut = segEnd - (segEnd - segStart) * 0.15;
        const fadeOut = segEnd;

        let opacity = 0, y = 30;
        if (p >= fadeIn && p < fullIn) {
          const t = (p - fadeIn) / (fullIn - fadeIn);
          opacity = t;
          y = 30 * (1 - t);
        } else if (p >= fullIn && p <= fullOut) {
          opacity = 1;
          y = 0;
        } else if (p > fullOut && p <= fadeOut) {
          const t = (p - fullOut) / (fadeOut - fullOut);
          opacity = 1 - t;
          y = -20 * t;
        }
        b.style.opacity = opacity;
        b.style.transform = `translate(-50%, -50%) translateY(${y}px)`;
      });
    }
  });
}

if (isMobile && beats.length) {
  const bio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        bio.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  beats.forEach(b => {
    b.style.opacity = '0';
    b.style.transform = 'translateY(30px)';
    b.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    bio.observe(b);
  });
}

/* ---------- Sticky stack "approach" — subtle depth on stack ---------- */
if (!reduceMotion) {
  document.querySelectorAll('.stack__card').forEach((card, i, all) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top ' + (80 + i * 20) + 'px',
      end: '+=' + (window.innerHeight * (all.length - i)),
      onUpdate: (self) => {
        // scale/fade earlier cards as later ones pin over them
        const p = self.progress;
        if (i < all.length - 1) {
          gsap.set(card, { scale: 1 - p * 0.04, opacity: 1 - p * 0.12 });
        }
      }
    });
  });
}

/* ---------- (Dynamic slot removed — not used in this template) ---------- */

/* ---------- Smooth anchor scrolling (Lenis-aware) ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const tgt = document.querySelector(id);
    if (!tgt) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(tgt, { offset: -80, duration: 1.3 });
    else tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---------- Refresh ScrollTrigger after fonts/images settle ---------- */
window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 400));
if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(() => ScrollTrigger.refresh(), 200));
