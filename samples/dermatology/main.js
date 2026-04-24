/* =========================================================
   Halden Derm — landing page motion
   ========================================================= */

gsap.registerPlugin(ScrollTrigger);

const isMobile = matchMedia('(max-width: 960px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const RECORD_MODE = new URLSearchParams(location.search).has('record');
if (RECORD_MODE) document.documentElement.classList.add('is-recording');

/* ---------- Page curtain + first paint ---------- */
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    document.body.classList.remove('no-scroll-yet');
    const curtain = document.querySelector('.curtain');
    if (curtain) {
      setTimeout(() => curtain.classList.add('is-done'), 1100);
      setTimeout(() => curtain.remove(), 2400);
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

/* ---------- Hide nav on scroll down ---------- */
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
  el.addEventListener('mouseleave', () => {
    strengthX(0);
    strengthY(0);
  });
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

/* ---------- Typewriter in hero card ---------- */
const twPhrases = [
  'pigmented nevus',
  'atopic flare',
  'contact allergy',
  'rosacea patterns',
  'actinic change',
  'seborrhoeic keratosis',
  'melanocytic atypia',
  'post-inflammatory pigment',
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
      }, 48);
    }
  }, 30);
}
setTimeout(typewriterLoop, 2000);

/* ---------- Counter animation (runs once in view) ---------- */
document.querySelectorAll('[data-counter]').forEach((el) => {
  const target = parseFloat(el.dataset.target) || 0;
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const co = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      co.disconnect();
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2.4,
        ease: 'power3.out',
        onUpdate: () => {
          const v = obj.v;
          if (decimals > 0) {
            el.firstChild ? (el.childNodes[0].nodeValue = v.toFixed(decimals)) : (el.textContent = v.toFixed(decimals));
            el.textContent = v.toFixed(decimals);
          } else {
            el.textContent = Math.floor(v).toLocaleString('en-GB');
          }
        }
      });
    }
  }, { threshold: 0.35 });
  co.observe(el);
});

/* ---------- Journey: scroll-synced beats ---------- */
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

/* ---------- Sticky stack depth ---------- */
if (!reduceMotion) {
  document.querySelectorAll('.stack__card').forEach((card, i, all) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top ' + (80 + i * 20) + 'px',
      end: '+=' + (window.innerHeight * (all.length - i)),
      onUpdate: (self) => {
        const p = self.progress;
        if (i < all.length - 1) {
          gsap.set(card, { scale: 1 - p * 0.04, opacity: 1 - p * 0.12 });
        }
      }
    });
  });
}

/* ---------- Slot picker ---------- */
(function buildSlots() {
  const root = document.getElementById('slots');
  if (!root) return;
  const dayNames = ['Tue','Wed','Thu','Fri','Sat','Tue','Wed'];
  const startDate = new Date(2026, 3, 21); // Tue 21 Apr 2026
  const times = ['09:00','09:40','10:20','11:00','11:40','12:20','14:00','14:40','15:20','16:00','16:40'];
  // Deterministic pseudo-random so layout is stable.
  function rnd(seed) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }
  for (let d = 0; d < 7; d++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    const day = document.createElement('div');
    day.className = 'slots__day';
    day.innerHTML = `
      <div class="slots__day-head">
        <span class="slots__day-name">${dayNames[d]}</span>
        <span class="slots__day-num">${String(date.getDate()).padStart(2,'0')}</span>
      </div>
    `;
    // pick 3 time slots per day
    const picks = [];
    while (picks.length < 3) {
      const idx = Math.floor(rnd(d * 13 + picks.length * 7) * times.length);
      if (!picks.includes(idx)) picks.push(idx);
    }
    picks.sort((a,b) => a - b);
    picks.forEach((idx, k) => {
      const t = times[idx];
      const taken = rnd(d * 17 + k * 31) < 0.6;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.textContent = t;
      btn.setAttribute('data-taken', taken ? 'true' : 'false');
      if (!taken) {
        btn.addEventListener('click', () => {
          const dd = date.toDateString();
          const subject = encodeURIComponent(`Booking request — ${dd} at ${t}`);
          const body = encodeURIComponent(
            `Hello,\n\nI'd like to book the ${t} slot on ${dd} for a dermatology consultation.\n\nFull name:\nDate of birth:\nPhone:\nReason for visit:\nInsurer (if any):\n\nThank you.`
          );
          window.location.href = `mailto:hello@haldenderm.com?subject=${subject}&body=${body}`;
        });
      }
      day.appendChild(btn);
    });
    root.appendChild(day);
  }
})();

/* ---------- Smooth anchor scrolling ---------- */
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

/* ---------- Refresh ScrollTrigger after fonts settle ---------- */
window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 400));
if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(() => ScrollTrigger.refresh(), 200));
