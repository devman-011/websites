/* =========================================================
   Elm & Ivy — landing page motion
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
// When ?record=1 is in the URL we're being captured headlessly.
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
    document.querySelectorAll('.hero [data-reveal], .hero [data-reveal-stagger]').forEach(el => el.classList.add('is-inview'));
  });
});

/* ---------- Lenis smooth scroll ---------- */
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

/* ---------- Nav hide on scroll ---------- */
const nav = document.querySelector('.nav');
let lastY = 0;
function navVisibility() {
  const y = window.scrollY;
  if (y > lastY && y > 200) nav.classList.add('is-hidden');
  else nav.classList.remove('is-hidden');
  lastY = y;
}
window.addEventListener('scroll', navVisibility, { passive: true });

/* ---------- Reveal-on-scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-inview');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
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
  el.addEventListener('mouseleave', () => { strengthX(0); strengthY(0); });
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
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    rx(ny * -5);
    ry(nx * 5);
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

/* ---------- Typewriter (hero card) ---------- */
const twPhrases = [
  'first antenatal review',
  '20-week anatomy scan',
  'growth check at 34 weeks',
  'postnatal six-week',
  'well-woman clinic',
  'menopause consultation',
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
          setTimeout(typewriterLoop, 2400);
        }
      }, 42);
    }
  }, 26);
}
setTimeout(typewriterLoop, 1800);

/* ---------- Counter animations (realistic numbers) ---------- */
document.querySelectorAll('.counter').forEach(el => {
  const target = parseFloat(el.dataset.target) || 0;
  const format = el.dataset.format || 'int';
  const co = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      co.disconnect();
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2.4,
        ease: 'power3.out',
        onUpdate: () => {
          let v = obj.v;
          if (format === 'int') {
            el.textContent = Math.floor(v).toLocaleString('en-GB');
          } else if (format === 'pct') {
            el.textContent = v.toFixed(1) + '%';
          } else if (format === 'rating') {
            el.innerHTML = v.toFixed(2) + '<span class="unit">&thinsp;/&thinsp;5</span>';
          }
        }
      });
    }
  }, { threshold: 0.35 });
  co.observe(el);
});

/* ---------- Journey: scroll-sequenced fade beats (NOT scrub) ---------- */
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

/* ---------- Sticky stack depth ---------- */
if (!reduceMotion) {
  document.querySelectorAll('.stack__card').forEach((card, i, all) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top ' + (80 + i * 20) + 'px',
      end: '+=' + (window.innerHeight * (all.length - i)),
      onUpdate: (self) => {
        const p = self.progress;
        if (i < all.length - 1) gsap.set(card, { scale: 1 - p * 0.04, opacity: 1 - p * 0.12 });
      }
    });
  });
}

/* ---------- Slot picker widget ---------- */
const slotDaysEl = document.getElementById('slotDays');
const slotTimesEl = document.getElementById('slotTimes');
const slotMonthEl = document.getElementById('slotMonthLabel');
const slotCtaText = document.getElementById('slotCtaText');

if (slotDaysEl && slotTimesEl) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fixedTimes = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

  // Seven days, starting tomorrow
  const start = new Date();
  start.setDate(start.getDate() + 1);

  let activeDay = 0;
  let activeTime = null;

  // Deterministic "availability" per day based on date, so slots feel real
  function slotsForDay(d) {
    const seed = d.getDate() + d.getMonth();
    const dow = d.getDay();
    if (dow === 0) return { avail: 0, times: [] };        // Sunday closed
    if (dow === 6) return { avail: 2, times: ['10:30', '12:00'] };  // Sat half
    // Mon–Fri: vary
    const pool = fixedTimes.slice();
    const drop = seed % 3;
    for (let i = 0; i < drop; i++) pool.splice((seed + i * 3) % pool.length, 1);
    return { avail: pool.length, times: pool };
  }

  function renderDays() {
    slotDaysEl.innerHTML = '';
    if (slotMonthEl) {
      slotMonthEl.textContent = months[start.getMonth()] + ' ' + start.getFullYear();
    }
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const s = slotsForDay(d);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-day' + (s.avail === 0 ? ' is-full' : '') + (i === activeDay ? ' is-active' : '');
      btn.innerHTML = `
        <span class="slot-day__dow">${dows[d.getDay()]}</span>
        <span class="slot-day__num">${d.getDate()}</span>
        <span class="slot-day__avail">${s.avail === 0 ? 'closed' : s.avail + ' free'}</span>
      `;
      if (s.avail > 0) {
        btn.addEventListener('click', () => {
          activeDay = i;
          activeTime = null;
          renderDays();
          renderTimes();
          updateCta();
        });
      }
      slotDaysEl.appendChild(btn);
    }
  }

  function renderTimes() {
    slotTimesEl.innerHTML = '';
    const d = new Date(start);
    d.setDate(start.getDate() + activeDay);
    const s = slotsForDay(d);
    if (s.times.length === 0) {
      slotTimesEl.innerHTML = '<span class="mono muted" style="padding:0.6rem 0;">No consultations on this day &middot; reception answers directly.</span>';
      return;
    }
    s.times.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-time' + (activeTime === t ? ' is-active' : '');
      btn.textContent = t;
      btn.addEventListener('click', () => {
        activeTime = t;
        renderTimes();
        updateCta();
      });
      slotTimesEl.appendChild(btn);
    });
  }

  function updateCta() {
    if (!slotCtaText) return;
    if (activeTime) {
      const d = new Date(start);
      d.setDate(start.getDate() + activeDay);
      const label = dows[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()].slice(0,3) + ' · ' + activeTime;
      slotCtaText.textContent = 'Hold ' + label;
    } else {
      slotCtaText.textContent = 'Hold this half-hour';
    }
  }

  renderDays();
  renderTimes();
}

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

/* ---------- ScrollTrigger refresh ---------- */
window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 400));
if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(() => ScrollTrigger.refresh(), 200));
