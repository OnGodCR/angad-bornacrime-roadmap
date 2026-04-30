/* ═══════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════ */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ═══════════════════════════════════════════════════════════
   ELEMENTS
═══════════════════════════════════════════════════════════ */
const hero         = document.getElementById('hero');
const pStars       = document.getElementById('pStars');
const pMoon        = document.getElementById('pMoon');
const pMountains   = document.getElementById('pMountains');
const pCity        = document.getElementById('pCity');
const pRoad        = document.getElementById('pRoad');
const car          = document.getElementById('car');
const carSvg       = document.getElementById('carSvg');
const wheelF       = document.getElementById('wheelF');
const wheelR       = document.getElementById('wheelR');
const headlight    = document.getElementById('headlightBeam');
const dashAnim     = document.getElementById('dashAnim');
const roadWrapper  = document.getElementById('roadWrapper');

/* ═══════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════ */
let scrollY      = 0;
let prevScrollY  = 0;
let rawVelocity  = 0;
let smoothVel    = 0;
let tilt         = 0;       // current car tilt (deg)
let wheelAngle   = 0;       // cumulative wheel rotation (deg)
let bounceT      = 0;       // time counter for bounce

/* ═══════════════════════════════════════════════════════════
   PARALLAX — hero layers
═══════════════════════════════════════════════════════════ */
function updateParallax() {
  const sy = window.scrollY;
  const heroH = hero.offsetHeight;
  if (sy > heroH + 200) return; // Skip when far past hero

  // Each layer moves at a different fraction of scroll
  pStars.style.transform     = `translateY(${sy * 0.08}px)`;
  pMoon.style.transform      = `translateY(${sy * 0.18}px)`;
  pMountains.style.transform = `translateY(${sy * 0.38}px)`;
  pCity.style.transform      = `translateY(${sy * 0.55}px)`;
  pRoad.style.transform      = `translateY(${sy * 0.75}px)`;

  // Fade out hero content gently
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    const fade = clamp(1 - sy / (heroH * 0.6), 0, 1);
    heroContent.style.opacity = fade;
    heroContent.style.transform = `translateY(${sy * 0.12}px)`;
  }
}

/* ═══════════════════════════════════════════════════════════
   CAR ANIMATION
═══════════════════════════════════════════════════════════ */
function updateCar(dt) {
  scrollY     = window.scrollY;
  rawVelocity = scrollY - prevScrollY;
  prevScrollY = scrollY;

  // Smooth velocity with lerp (reduces jitter)
  smoothVel = lerp(smoothVel, rawVelocity, 0.15);

  // ── Tilt ──
  const targetTilt = clamp(smoothVel * 0.55, -9, 9);
  tilt = lerp(tilt, targetTilt, 0.07);
  car.style.transform = `rotate(${tilt.toFixed(2)}deg)`;

  // ── Wheel rotation ──
  // Speed proportional to absolute scroll velocity
  wheelAngle += Math.abs(smoothVel) * 3.5 + 0.4; // +0.4 = always spin a little
  const wa = wheelAngle.toFixed(1);
  wheelF.setAttribute('transform', `rotate(${wa} 83 44)`);
  wheelR.setAttribute('transform', `rotate(${wa} 27 44)`);

  // ── Subtle vertical bounce (road feel) ──
  bounceT += 0.04 + Math.abs(smoothVel) * 0.002;
  const bounce = Math.sin(bounceT) * 1.8 * (1 + Math.abs(smoothVel) * 0.05);
  car.style.marginTop = `${bounce.toFixed(2)}px`;

  // ── Headlight glow intensity ──
  const speed = Math.abs(smoothVel);
  if (headlight) {
    headlight.style.opacity = clamp(0.3 + speed * 0.04, 0.3, 0.9).toFixed(2);
  }

  // ── Road dash speed ──
  if (dashAnim) {
    const dashDur = clamp(0.85 / (1 + Math.abs(smoothVel) * 0.06), 0.25, 1.2);
    dashAnim.style.animationDuration = `${dashDur.toFixed(3)}s`;
  }
}

/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL (IntersectionObserver)
═══════════════════════════════════════════════════════════ */
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Slight stagger per card
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        revealObs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ═══════════════════════════════════════════════════════════
   WAYSTATION DOTS — highlight active
═══════════════════════════════════════════════════════════ */
const waystations = document.querySelectorAll('.waystation');

const wsObs = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      const dot = entry.target.querySelector('.ws-dot');
      if (!dot) return;
      if (entry.isIntersecting) {
        dot.style.background = 'var(--yellow)';
        dot.style.transform  = 'scale(1.2)';
      } else {
        dot.style.transform  = 'scale(1)';
      }
    });
  },
  { threshold: 0.3 }
);

waystations.forEach(ws => wsObs.observe(ws));

/* ═══════════════════════════════════════════════════════════
   BACKGROUND AMBIENT SHIFT
   — sky gradually lightens from deep night toward pre-dawn
     as user scrolls through all lessons
═══════════════════════════════════════════════════════════ */
function updateAmbient() {
  if (!roadWrapper) return;
  const rect   = roadWrapper.getBoundingClientRect();
  const total  = roadWrapper.offsetHeight - window.innerHeight;
  const progress = clamp(-rect.top / total, 0, 1);

  // Interpolate: deep indigo → slightly warmer navy
  const h = lerp(240, 225, progress);
  const s = lerp(60,  45,  progress);
  const l = lerp(4,   8,   progress);
  document.body.style.background = `hsl(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%)`;
}

/* ═══════════════════════════════════════════════════════════
   RAF LOOP — one tick for everything smooth
═══════════════════════════════════════════════════════════ */
let lastTime = 0;

function tick(ts) {
  const dt = ts - lastTime;
  lastTime = ts;

  updateParallax();
  updateCar(dt);
  updateAmbient();

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
