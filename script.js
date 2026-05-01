/* ─── utils ─────────────────────────────────────────────── */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ─── elements ──────────────────────────────────────────── */
const hero        = document.getElementById('hero');
const pStars      = document.getElementById('pStars');
const pMoon       = document.getElementById('pMoon');
const pMountains  = document.getElementById('pMountains');
const pCity       = document.getElementById('pCity');
const pRoad       = document.getElementById('pRoad');
const heroContent = document.querySelector('.hero-content');
const car         = document.getElementById('car');
const wheelF      = document.getElementById('wheelF');
const wheelR      = document.getElementById('wheelR');

/* ─── state ─────────────────────────────────────────────── */
let scrollY    = window.scrollY;
let lastScrollY = scrollY;
let smoothVel  = 0;
let tilt       = 0;
let wheelAngle = 0;
let bounceT    = 0;

/* Capture scroll on the event, consume in rAF — avoids mid-frame reads */
window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

/* ─── parallax ──────────────────────────────────────────── */
const heroH = hero.offsetHeight;

function updateParallax() {
  if (scrollY > heroH + 200) return;

  pStars.style.transform     = `translateY(${scrollY * 0.08}px)`;
  pMoon.style.transform      = `translateY(${scrollY * 0.18}px)`;
  pMountains.style.transform = `translateY(${scrollY * 0.38}px)`;
  pCity.style.transform      = `translateY(${scrollY * 0.55}px)`;
  pRoad.style.transform      = `translateY(${scrollY * 0.75}px)`;

  if (heroContent) {
    const fade = clamp(1 - scrollY / (heroH * 0.6), 0, 1);
    /* opacity + transform together — one composite layer, no reflow */
    heroContent.style.opacity   = fade;
    heroContent.style.transform = `translateY(${scrollY * 0.1}px)`;
  }
}

/* ─── reveal (IntersectionObserver) ─────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ─── rAF loop ───────────────────────────────────────────── */
function tick() {
  const rawVel = scrollY - lastScrollY;
  lastScrollY  = scrollY;

  smoothVel = lerp(smoothVel, rawVel, 0.12);

  /* Parallax */
  updateParallax();

  /* Car tilt — GPU-only transform, no layout */
  const targetTilt = clamp(smoothVel * 0.45, -7, 7);
  tilt = lerp(tilt, targetTilt, 0.07);

  /* Bounce via transform (not marginTop) — no layout reflow */
  bounceT += 0.032 + Math.abs(smoothVel) * 0.001;
  const bounce = Math.sin(bounceT) * 1.4;

  car.style.transform = `rotate(${tilt.toFixed(2)}deg) translateY(${bounce.toFixed(2)}px)`;

  /* Wheel spin */
  wheelAngle += Math.abs(smoothVel) * 2.8 + 0.25;
  const wa = wheelAngle.toFixed(1);
  wheelF.setAttribute('transform', `rotate(${wa} 83 44)`);
  wheelR.setAttribute('transform', `rotate(${wa} 27 44)`);

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

/* ─── modal ──────────────────────────────────────────────── */
const modalOverlay = document.getElementById('modalOverlay');
const modalPanel   = document.getElementById('modalPanel');
const modalClose   = document.getElementById('modalClose');
const modalBody    = document.getElementById('modalBody');

function openModal(targetId) {
  const source = document.getElementById(targetId);
  if (!source) return;

  /* Clone the stored content into the modal body */
  modalBody.innerHTML = source.innerHTML;
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalPanel.scrollTop = 0;
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* Card clicks */
document.querySelectorAll('.stop-card').forEach(card => {
  card.addEventListener('click', () => openModal(card.dataset.target));
});

/* Close triggers: button, overlay backdrop, Escape key */
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
