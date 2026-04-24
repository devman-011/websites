/* =========================================================
   Drayton Bone & Joint — landing page motion
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);

const isMobile = matchMedia('(max-width: 960px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// ?record=1 => headless capture mode; disable heavyweight JS so Chromium can render frames on time.
const RECORD_MODE = new URLSearchParams(location.search).has('record');
if (RECORD_MODE) document.documentElement.classList.add('is-recording');

/* ---------- Curtain + first paint ---------- */
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    document.body.classList.remove('no-scroll-yet');
    const curtain = document.querySelector('.curtain');
    if (curtain) {
      setTimeout(() => curtain.classList.add('is-done'), 900);
      setTimeout(() => curtain.remove(), 2200);
    }
    document.querySelectorAll('.hero [data-reveal], .hero [data-reveal-stagger]')
      .forEach(el => el.classList.add('is-inview'));
  });
});

/* ---------- Smooth scroll (Lenis) ---------- */
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

/* ---------- Nav hide on scroll down ---------- */
const nav = document.querySelector('.nav');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > lastY && y > 220) nav?.classList.add('is-hidden');
  else nav?.classList.remove('is-hidden');
  lastY = y;
}, { passive: true });

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-inview'); io.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(el => io.observe(el));

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll('[data-magnetic]').forEach(el => {
  if (reduceMotion || RECORD_MODE || isMobile) return;
  const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
  const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    qx((e.clientX - (r.left + r.width / 2)) * 0.25);
    qy((e.clientY - (r.top + r.height / 2)) * 0.35);
  });
  el.addEventListener('mouseleave', () => { qx(0); qy(0); });
});

/* ---------- Portrait tilt ---------- */
document.querySelectorAll('[data-tilt]').forEach(el => {
  if (reduceMotion || isMobile || RECORD_MODE) return;
  const portrait = el.querySelector('.prac__portrait');
  if (!portrait) return;
  const rx = gsap.quickTo(portrait, 'rotationX', { duration: 0.5, ease: 'power3.out' });
  const ry = gsap.quickTo(portrait, 'rotationY', { duration: 0.5, ease: 'power3.out' });
  gsap.set(portrait, { transformPerspective: 900, transformOrigin: 'center' });
  el.addEventListener('mousemove', (e) => {
    const r = portrait.getBoundingClientRect();
    rx(((e.clientY - r.top) / r.height - 0.5) * -6);
    ry(((e.clientX - r.left) / r.width  - 0.5) *  6);
  });
  el.addEventListener('mouseleave', () => { rx(0); ry(0); });
});

/* ---------- Mobile menu ---------- */
const burger = document.querySelector('.nav__burger');
const menu   = document.querySelector('.menu');
burger?.addEventListener('click', () => {
  const open = burger.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
  menu?.classList.toggle('is-open', open);
  menu?.setAttribute('aria-hidden', String(!open));
  document.body.style.overflow = open ? 'hidden' : '';
});
menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => burger.click()));

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq__item').forEach(item => {
  const btn = item.querySelector('.faq__q');
  btn?.addEventListener('click', () => {
    const open = item.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
});

/* ---------- Typewriter (hero card) ---------- */
const twPhrases = [
  'ACL assessment', 'rotator cuff review', 'post-op knee rehab',
  'runner’s gait analysis', 'tennis elbow imaging',
  'achilles tendinopathy', 'paediatric growth-plate review',
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
          clearInterval(type); twI++;
          setTimeout(typewriterLoop, 2200);
        }
      }, 45);
    }
  }, 26);
}
setTimeout(typewriterLoop, 1800);

/* ---------- Counters (metrics grid) ---------- */
document.querySelectorAll('[data-counter]').forEach(el => {
  const target   = parseFloat(el.dataset.counter) || 0;
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const unitHTML = el.querySelector('.unit') ? el.querySelector('.unit').outerHTML : '';
  const co = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      co.disconnect();
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 2.4, ease: 'power3.out',
        onUpdate: () => {
          const n = obj.v.toLocaleString('en-GB', {
            minimumFractionDigits: decimals, maximumFractionDigits: decimals,
          });
          el.innerHTML = n + unitHTML;
        },
      });
    }
  }, { threshold: 0.35 });
  co.observe(el);
});

/* ---------- Journey: video + scroll-synced beats (fade-based) ---------- */
const journeyVideo   = document.getElementById('journeyVideo');
const journeySection = document.querySelector('.journey');
const beats          = document.querySelectorAll('.journey__beat');
const progressBar    = document.getElementById('journeyBar');
if (journeyVideo) journeyVideo.play().catch(() => {});

if (journeySection && beats.length && !isMobile) {
  beats.forEach(b => {
    b.style.opacity = '0';
    b.style.transform = 'translate(-50%, -50%) translateY(30px)';
  });
  ScrollTrigger.create({
    trigger: journeySection, start: 'top top', end: 'bottom bottom',
    scrub: RECORD_MODE ? true : 0.6,
    onUpdate: (self) => {
      const p = self.progress;
      if (progressBar) progressBar.parentElement.style.setProperty('--p', String(p));
      const n = beats.length;
      beats.forEach((b, i) => {
        const segStart = i / n, segEnd = (i + 1) / n;
        const fullIn   = segStart + (segEnd - segStart) * 0.18;
        const fullOut  = segEnd   - (segEnd - segStart) * 0.18;
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
    },
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

/* ---------- Sticky approach stack — subtle depth ---------- */
if (!reduceMotion && !RECORD_MODE) {
  document.querySelectorAll('.stack__card').forEach((card, i, all) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top ' + (80 + i * 20) + 'px',
      end:   '+=' + (window.innerHeight * (all.length - i)),
      onUpdate: (self) => {
        if (i < all.length - 1) {
          const p = self.progress;
          gsap.set(card, { scale: 1 - p * 0.04, opacity: 1 - p * 0.12 });
        }
      },
    });
  });
}

/* ---------- Slot picker ---------- */
(function slotPicker () {
  const root = document.querySelector('[data-slotpicker]');
  if (!root) return;
  const daysEl  = root.querySelector('.slotpicker__days');
  const timesEl = root.querySelector('.slotpicker__times');
  const readout = document.getElementById('slotReadout');
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const SLOTS = ['08:40', '09:20', '10:00', '11:20', '14:00', '15:20', '16:00', '17:40'];

  // Next 5 working days starting tomorrow.
  const today = new Date();
  const days = [];
  let d = new Date(today);
  while (days.length < 5) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(d));
  }
  // Deterministic "taken" flags per date — stays consistent between renders.
  const takenFor = (date) => {
    const seed = date.getDate() + date.getMonth() * 31;
    return SLOTS.map((_, i) => ((seed * 9301 + i * 49297) % 233280) / 233280 < 0.34);
  };

  let activeDate = days[0], pickedSlot = null;

  function renderDays () {
    daysEl.innerHTML = '';
    days.forEach((date) => {
      const btn = document.createElement('button');
      btn.className = 'slot-day';
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      if (date.getTime() === activeDate.getTime()) btn.classList.add('is-active');
      btn.innerHTML =
        `<span class="slot-day__dow">${DOW[date.getDay()]}</span>` +
        `<span class="slot-day__date">${String(date.getDate()).padStart(2, '0')}</span>` +
        `<span class="slot-day__month">${MON[date.getMonth()]}</span>`;
      btn.addEventListener('click', () => {
        activeDate = date; pickedSlot = null;
        renderDays(); renderTimes(); updateReadout();
      });
      daysEl.appendChild(btn);
    });
  }
  function renderTimes () {
    timesEl.innerHTML = '';
    const takenMap = takenFor(activeDate);
    SLOTS.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'slot-time'; b.type = 'button'; b.textContent = t;
      if (takenMap[i]) { b.classList.add('is-taken'); b.setAttribute('aria-disabled', 'true'); }
      else b.addEventListener('click', () => {
        pickedSlot = t;
        timesEl.querySelectorAll('.slot-time').forEach(el => el.classList.remove('is-picked'));
        b.classList.add('is-picked');
        updateReadout();
      });
      timesEl.appendChild(b);
    });
  }
  function updateReadout () {
    if (!readout) return;
    const dLabel = `${DOW[activeDate.getDay()]} ${String(activeDate.getDate()).padStart(2, '0')} ${MON[activeDate.getMonth()]}`;
    if (pickedSlot) {
      readout.textContent = `Holding ${pickedSlot} · ${dLabel} · we'll call to confirm`;
      readout.classList.add('is-set');
    } else {
      readout.textContent = `${dLabel} · pick a time slot ·`;
      readout.classList.remove('is-set');
    }
  }

  renderDays(); renderTimes(); updateReadout();
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

/* ---------- Refresh ScrollTrigger after assets settle ---------- */
window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 400));
if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(() => ScrollTrigger.refresh(), 200));
