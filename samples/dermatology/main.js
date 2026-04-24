/* =========================================================
   Halden Derm — Marylebone dentistry
   Lenis + GSAP + ScrollTrigger. Quiet, deliberate motion.
   ========================================================= */

/* ---------- Bulletproof first-paint (runs before anything else) ---------- */
(function () {
  function lift() {
    try { document.body.classList.remove('no-scroll-yet'); } catch (e) {}
    var c = document.querySelector('.curtain');
    if (c) {
      setTimeout(function () { c.classList.add('is-done'); }, 900);
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 2200);
    }
    try {
      document.querySelectorAll('.hero [data-reveal], .hero [data-reveal-stagger]')
        .forEach(function (el) { el.classList.add('is-inview'); });
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lift, { once: true });
    // belt-and-braces: if DCL is somehow slow, force lift after 2.2s
    setTimeout(lift, 2200);
  } else {
    lift();
  }
})();


try { if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger); } catch (e) { console.warn('gsap.registerPlugin failed', e); }

const isMobile = matchMedia('(max-width: 960px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const RECORD_MODE = new URLSearchParams(location.search).has('record');
if (RECORD_MODE) document.documentElement.classList.add('is-recording');

/* ---------- Curtain + first paint ---------- */
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    document.body.classList.remove('no-scroll-yet');
    const curtain = document.querySelector('.curtain');
    setTimeout(() => curtain && curtain.classList.add('is-done'), 900);
    setTimeout(() => curtain && curtain.remove(), 2200);
    document.querySelectorAll('.hero [data-reveal], .hero [data-reveal-stagger]').forEach(el => el.classList.add('is-inview'));
  });
});

/* ---------- Lenis smooth scroll (bridged to GSAP) ---------- */
let lenis = null;
if (!reduceMotion && !RECORD_MODE) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.2,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Nav: hide on scroll down ---------- */
const nav = document.querySelector('.nav');
let lastY = 0;
function navVisibility() {
  const y = window.scrollY;
  if (y > lastY && y > 220) nav.classList.add('is-hidden');
  else nav.classList.remove('is-hidden');
  lastY = y;
}
window.addEventListener('scroll', navVisibility, { passive: true });

/* ---------- Reveal on scroll ---------- */
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
  const tx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
  const ty = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    tx((e.clientX - (r.left + r.width / 2)) * 0.22);
    ty((e.clientY - (r.top + r.height / 2)) * 0.32);
  });
  el.addEventListener('mouseleave', () => { tx(0); ty(0); });
});

/* ---------- Tilt on practitioner portraits ---------- */
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
    rx(ny * -5.5);
    ry(nx * 5.5);
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

/* ---------- FAQ accordion (morph +/-) ---------- */
document.querySelectorAll('.faq__item').forEach(item => {
  const btn = item.querySelector('.faq__q');
  btn.addEventListener('click', () => {
    const open = item.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
});

/* ---------- Typewriter (hero card) ---------- */
const twPhrases = [
  'invisalign planning',
  'digital smile design',
  'hygienist review',
  'implant consult',
  "child's first appointment",
  'composite bonding',
  'clincheck walkthrough',
];
const twEl = document.getElementById('twText');
let twI = 0;
function typewriterLoop() {
  if (!twEl) return;
  const next = twPhrases[twI % twPhrases.length];
  const current = twEl.textContent;
  let i = current.length;
  const erase = setInterval(() => {
    twEl.textContent = current.slice(0, --i);
    if (i <= 0) {
      clearInterval(erase);
      let j = 0;
      const type = setInterval(() => {
        twEl.textContent = next.slice(0, ++j);
        if (j >= next.length) {
          clearInterval(type);
          twI++;
          setTimeout(typewriterLoop, 2300);
        }
      }, 46);
    }
  }, 26);
}
setTimeout(typewriterLoop, 1800);

/* ---------- Counter animation (runs once in view) ---------- */
document.querySelectorAll('.counter[data-target]').forEach(el => {
  const target = parseFloat(el.dataset.target) || 0;
  const suffix = el.dataset.suffix || '';
  const useComma = el.dataset.format === 'comma';
  const co = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      co.disconnect();
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2.4,
        ease: 'power3.out',
        onUpdate: () => {
          const v = Math.floor(obj.v);
          el.textContent = (useComma ? v.toLocaleString('en-GB') : String(v)) + suffix;
        }
      });
    }
  }, { threshold: 0.4 });
  co.observe(el);
});

/* ---------- Journey: autoplay video + fade-based beats (scroll-synced) ---------- */
const journeyVideo = document.getElementById('journeyVideo');
const journeySection = document.querySelector('.journey');
const beats = document.querySelectorAll('.journey__beat');
const progressBar = document.getElementById('journeyBar');

if (journeyVideo) journeyVideo.play().catch(() => {});

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
        const fullIn = segStart + (segEnd - segStart) * 0.18;
        const fullOut = segEnd - (segEnd - segStart) * 0.18;
        let opacity = 0, y = 30;
        if (p >= segStart && p < fullIn) {
          const t = (p - segStart) / (fullIn - segStart);
          opacity = t; y = 30 * (1 - t);
        } else if (p >= fullIn && p <= fullOut) {
          opacity = 1; y = 0;
        } else if (p > fullOut && p <= segEnd) {
          const t = (p - fullOut) / (segEnd - fullOut);
          opacity = 1 - t; y = -20 * t;
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

/* ---------- Sticky stack subtle depth ---------- */
if (!reduceMotion) {
  document.querySelectorAll('.stack__card').forEach((card, i, all) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top ' + (80 + i * 20) + 'px',
      end: '+=' + (window.innerHeight * (all.length - i)),
      onUpdate: (self) => {
        const p = self.progress;
        if (i < all.length - 1) {
          gsap.set(card, { scale: 1 - p * 0.035, opacity: 1 - p * 0.1 });
        }
      }
    });
  });
}

/* ---------- Slot picker (7-day) ---------- */
(function slotPicker() {
  const daysEl = document.getElementById('slotDays');
  const timesEl = document.getElementById('slotTimes');
  const summaryEl = document.getElementById('slotSummary');
  if (!daysEl || !timesEl) return;

  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const allTimes = ['08:30', '09:30', '10:30', '11:30', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const weekday = d.getDay();
    const isSun = weekday === 0;
    // pseudo-random stable availability per index
    const seed = (d.getDate() * 13 + i * 7) % allTimes.length;
    const available = isSun ? [] :
      allTimes.filter((_, k) => ((k + seed) % 3 !== 0)).slice(0, 4 + (i % 3));
    days.push({ date: d, weekday, isFull: isSun || available.length === 0, available });
  }

  let activeIdx = days.findIndex(d => !d.isFull);
  if (activeIdx < 0) activeIdx = 0;
  let activeTime = null;

  function renderDays() {
    daysEl.innerHTML = '';
    days.forEach((d, i) => {
      const btn = document.createElement('button');
      btn.className = 'slot-day' + (i === activeIdx ? ' is-active' : '') + (d.isFull ? ' is-full' : '');
      btn.innerHTML = `
        <span class="slot-day__dow">${dow[d.weekday]}</span>
        <span class="slot-day__num">${d.date.getDate()}</span>
        <span class="slot-day__count">${d.isFull ? 'Closed' : d.available.length + ' open'}</span>
      `;
      if (!d.isFull) {
        btn.addEventListener('click', () => {
          activeIdx = i;
          activeTime = null;
          renderDays();
          renderTimes();
          updateSummary();
        });
      }
      daysEl.appendChild(btn);
    });
  }

  function renderTimes() {
    timesEl.innerHTML = '';
    const d = days[activeIdx];
    if (!d || d.isFull) {
      const span = document.createElement('span');
      span.className = 'slot-time is-empty';
      span.textContent = 'Closed — pick another day';
      timesEl.appendChild(span);
      return;
    }
    d.available.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'slot-time' + (t === activeTime ? ' is-active' : '');
      btn.textContent = t;
      btn.addEventListener('click', () => {
        activeTime = t;
        renderTimes();
        updateSummary();
      });
      timesEl.appendChild(btn);
    });
  }

  function updateSummary() {
    if (!summaryEl) return;
    const d = days[activeIdx];
    if (!d) { summaryEl.textContent = 'Pick a day above'; summaryEl.classList.remove('is-selected'); return; }
    const label = `${dow[d.weekday]} ${d.date.getDate()} ${mon[d.date.getMonth()]}`;
    if (activeTime) {
      summaryEl.innerHTML = `Holding <strong>${label} · ${activeTime}</strong> — confirm below.`;
      summaryEl.classList.add('is-selected');
    } else {
      summaryEl.innerHTML = `<strong>${label}</strong> · choose a time`;
      summaryEl.classList.add('is-selected');
    }
  }

  renderDays();
  renderTimes();
  updateSummary();
})();

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
