/*
 * Main JavaScript for the Redbeard Rigging site
 *
 * This file handles simple interactions such as toggling the
 * mobile navigation menu, updating the current year in the
 * footer, and managing the placeholder quote form. No network
 * requests are made – the form submission simply shows a
 * message locally. If you wire this form to a backend
 * service later, replace the handleQuoteRequest function.
 */

// ===============================
// Animated Starfield Background
// ===============================
class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.numStars = window.matchMedia('(max-width: 920px)').matches ? 320 : 800;
    this.speed = 0.5;
    this.mouseX = 0;
    this.mouseY = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.raf = 0;
    this.visible = true;

    this.resize();
    this.createStars();
    this.bindEvents();
    this.observeVisibility();
    this.animate();
  }

  observeVisibility() {
    const obs = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
    }, { threshold: 0, rootMargin: '50px' });
    obs.observe(this.canvas);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }

  createStars() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width - this.centerX,
        y: Math.random() * this.canvas.height - this.centerY,
        z: Math.random() * 1000,
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  bindEvents() {
    const onResize = () => {
      this.resize();
      this.numStars = window.innerWidth <= 920 ? 320 : 800;
      this.createStars();
    };
    window.addEventListener('resize', onResize, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX - this.centerX) * 0.0003;
      this.mouseY = (e.clientY - this.centerY) * 0.0003;
    }, { passive: true });
  }

  animate() {
    if (!this.visible) {
      this.raf = requestAnimationFrame(() => this.animate());
      return;
    }
    this.ctx.fillStyle = 'rgba(5, 7, 12, 0.15)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const time = Date.now() * 0.001;

    for (let star of this.stars) {
      // Move star towards viewer
      star.z -= this.speed + (star.z / 1000) * 0.5;

      // Reset star if it passes the viewer
      if (star.z <= 0) {
        star.x = Math.random() * this.canvas.width - this.centerX;
        star.y = Math.random() * this.canvas.height - this.centerY;
        star.z = 1000;
        star.brightness = Math.random() * 0.5 + 0.5;
      }

      // Add mouse parallax effect
      const parallaxX = this.mouseX * star.z * 0.5;
      const parallaxY = this.mouseY * star.z * 0.5;

      // Project 3D to 2D
      const scale = 300 / star.z;
      const x = (star.x + parallaxX) * scale + this.centerX;
      const y = (star.y + parallaxY) * scale + this.centerY;

      // Skip if outside canvas
      if (x < 0 || x > this.canvas.width || y < 0 || y > this.canvas.height) {
        continue;
      }

      // Calculate size and brightness based on depth
      const size = Math.max(0.1, star.size * scale * 0.5);
      const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase) * 0.3 + 0.7;
      const alpha = Math.min(1, (1 - star.z / 1000) * star.brightness * twinkle);

      // Draw star with glow effect
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(200, 220, 255, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');

      this.ctx.beginPath();
      this.ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Draw core
      this.ctx.beginPath();
      this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fill();
    }

    this.raf = requestAnimationFrame(() => this.animate());
  }
}

// ===============================
// Full-page image carousel background
// ===============================
const BG_CAROUSEL_IMAGES = [
  'assets/redbeard/IMG_0048.JPG',
  'assets/redbeard/IMG_0311.JPG',
  'assets/redbeard/IMG_1112.JPG',
  'assets/redbeard/IMG_1134.JPG',
  'assets/redbeard/IMG_1167.JPG',
  'assets/redbeard/IMG_1266.JPG',
  'assets/redbeard/IMG_1288.JPG',
  'assets/redbeard/IMG_1289.JPG',
  'assets/redbeard/IMG_1290.JPG',
  'assets/redbeard/IMG_1317.JPG',
  'assets/redbeard/IMG_1320.JPG',
  'assets/redbeard/IMG_1324.JPG',
  'assets/redbeard/IMG_1330.JPG',
  'assets/redbeard/IMG_5524.JPG',
  'assets/redbeard/IMG_5624.JPG'
];
const BG_APPROACH_MS = 2500;   /* same feel as starfield approach */
const BG_HOLD_MS = 5000;      /* sit there 5 seconds */
const BG_DISINTEGRATE_MS = 2500;

function initBgImageCarousel() {
  const container = document.getElementById('bgImageCarousel');
  if (!container || !BG_CAROUSEL_IMAGES.length) return;

  BG_CAROUSEL_IMAGES.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'bgImageCarousel__slide' + (i === 0 ? ' is-active is-entering' : '');
    /* Encode path so spaces in folder names (e.g. IMAGES NEED SORTING) work in url() */
    slide.style.backgroundImage = 'url(' + encodeURI(src) + ')';
    slide.setAttribute('aria-hidden', 'true');
    container.appendChild(slide);
  });

  const slides = container.querySelectorAll('.bgImageCarousel__slide');
  let index = 0;

  function advance() {
    const current = slides[index];
    current.classList.remove('is-entering');
    current.classList.add('is-disintegrating');

    setTimeout(() => {
      current.classList.remove('is-active', 'is-disintegrating');
      index = (index + 1) % slides.length;
      const next = slides[index];
      next.classList.add('is-active', 'is-entering');
      next.style.animation = 'none';
      next.offsetHeight;
      next.style.animation = '';

      setTimeout(() => {
        next.classList.remove('is-entering');
        setTimeout(advance, BG_HOLD_MS);
      }, BG_APPROACH_MS);
    }, BG_DISINTEGRATE_MS);
  }

  setTimeout(() => {
    slides[index].classList.remove('is-entering');
    setTimeout(advance, BG_HOLD_MS);
  }, BG_APPROACH_MS);
}

// ===============================
// Top logos video strip — MP4s from assets/top_logos.mp4/ loop above main
// ===============================
const TOP_LOGOS_VIDEOS = [
  'assets/top_logos.mp4/hf_20260201_054503_bbc3ddcb-2d0e-4da6-80d3-a6a1a82da455.mp4',
  'assets/top_logos.mp4/hf_20260201_055030_b7e06031-00c3-44fd-9218-7b9f23eee936.mp4',
  'assets/top_logos.mp4/hf_20260201_055315_3db4c88f-7f80-4581-8b61-f08805048bf3.mp4',
  'assets/top_logos.mp4/hf_20260201_055525_ae3b1718-d2b7-41a5-8941-81af820b5dea.mp4',
  'assets/top_logos.mp4/hf_20260201_055600_d0ef9407-0cf0-4b6a-8c89-b0d1dfee8ead.mp4',
  'assets/top_logos.mp4/hf_20260201_055838_c38f1d9d-f1e9-4cc8-9d14-190b67ef4dbb.mp4',
  'assets/top_logos.mp4/hf_20260201_055858_f58940ae-768d-46de-8527-57971948f15b.mp4',
  'assets/top_logos.mp4/hf_20260201_060043_a55b20a0-c8a0-440a-950e-c0be360af7e7.mp4',
  'assets/top_logos.mp4/hf_20260201_060616_157f93c9-5b19-400d-820d-19c04e5aaa46.mp4',
  'assets/top_logos.mp4/hf_20260201_061047_9cfec7c9-9396-4be8-8023-9dc702cd86e0.mp4',
  'assets/top_logos.mp4/hf_20260201_061144_851e7360-f6bc-4d3c-9cda-5bdb672f200e.mp4',
  'assets/top_logos.mp4/hf_20260201_061301_57d6a92c-373d-426d-8d9b-73076ead6642.mp4',
  'assets/top_logos.mp4/hf_20260201_061400_3135c996-c0eb-4d1c-b181-aca0e9247de0.mp4',
  'assets/top_logos.mp4/hf_20260201_061429_78fb37bd-43b2-4c50-becb-842dec599598.mp4',
  'assets/top_logos.mp4/hf_20260201_061930_8131cc5a-1c66-4f90-8b58-858cce912ec5.mp4'
];
const TOP_LOGOS_STRIP_INTERVAL_MS = 5500;

function initTopLogosStrip() {
  const container = document.getElementById('topLogosStripSlide');
  if (!container || !TOP_LOGOS_VIDEOS.length) return;

  function createVideoEl() {
    const v = document.createElement('video');
    v.className = 'topLogosStrip__video';
    v.muted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('loop', '');
    v.setAttribute('autoplay', '');
    return v;
  }

  const videoA = createVideoEl();
  const videoB = createVideoEl();
  container.appendChild(videoA);
  container.appendChild(videoB);

  let index = 0;
  let active = videoA;
  let next = videoB;

  function playNext() {
    const src = TOP_LOGOS_VIDEOS[index];
    next.muted = true;
    next.volume = 0;
    next.src = encodeURI(src);
    next.load();
    next.play().catch(() => {});

    active.classList.remove('is-active');
    next.classList.add('is-active');

    const swap = active;
    active = next;
    next = swap;
    index = (index + 1) % TOP_LOGOS_VIDEOS.length;
  }

  videoA.muted = true;
  videoA.volume = 0;
  videoA.src = encodeURI(TOP_LOGOS_VIDEOS[0]);
  videoA.play().catch(() => {});
  videoA.classList.add('is-active');
  index = 1;
  setInterval(playNext, TOP_LOGOS_STRIP_INTERVAL_MS);
}

document.addEventListener('DOMContentLoaded', () => {
  initBgImageCarousel();
  initTopLogosStrip();

  const starCanvas = document.getElementById('starfield');
  if (starCanvas) new Starfield(starCanvas);

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.menuToggle');
  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('.navlink').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  const form = document.getElementById('quoteForm');
  const formNote = document.getElementById('formNote');
  if (form && formNote) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formNote.textContent = 'Saved locally (placeholder). Wire this to email/CRM when details are ready.';
      formNote.classList.add('ok');
    });
  }
});