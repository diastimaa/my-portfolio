/* Andrei Jovic Laurel — portfolio interactions */
(() => {
  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Hero 3D scene: fly-in on load, then tilt toward the pointer ── */
  const root = document.documentElement;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));
  setTimeout(() => root.classList.add('is-ready'), 1700); // switch to the quicker follow transition

  const hero = document.getElementById('home');
  const rig = document.getElementById('sceneRig');
  if (hero && rig && finePointer && !reduceMotion) {
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        rig.style.setProperty('--ry', (-18 + x * 22).toFixed(2) + 'deg');
        rig.style.setProperty('--rx', (6 - y * 12).toFixed(2) + 'deg');
      });
    });
    hero.addEventListener('pointerleave', () => { rig.style.removeProperty('--ry'); rig.style.removeProperty('--rx'); });
  }

  /* ── Nav: scrolled state, mobile menu, active section ── */
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = [...document.querySelectorAll('.nav__links a')];

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  links.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ── Reveal on scroll (staggered within each parent) ── */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.setProperty('--d', Math.min(siblings.indexOf(el), 6) * 0.07 + 's');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ── Screenshot galleries (tabs swap the main image) ── */
  document.querySelectorAll('[data-gallery-for]').forEach((list) => {
    const target = document.querySelector(`[data-gallery="${list.dataset.galleryFor}"] [data-gallery-target]`);
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    // warm the cache so swaps are instant
    tabs.forEach((t) => { const i = new Image(); i.src = t.dataset.src; });

    const select = (tab) => {
      if (tab.getAttribute('aria-selected') === 'true') return;
      tabs.forEach((t) => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
      target.classList.add('is-swapping');
      setTimeout(() => {
        target.src = tab.dataset.src;
        target.alt = tab.dataset.alt;
        target.decode?.().catch(() => {}).finally(() => target.classList.remove('is-swapping'));
        if (!target.decode) target.classList.remove('is-swapping');
      }, reduceMotion ? 0 : 180);
    };
    tabs.forEach((t, i) => {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus(); select(next);
      });
    });
  });


  /* ── Contact form (Formspree) ── */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const FORMSPREE_URL = 'https://formspree.io/f/maqzooak';
  const fields = { name: 'msgName', email: 'msgEmail', message: 'msgBody' };

  const setError = (id, msg) => {
    const input = document.getElementById(id);
    const field = input.closest('.field');
    let err = field.querySelector('.field__error');
    if (!msg) { field.classList.remove('has-error'); input.removeAttribute('aria-invalid'); err?.remove(); return; }
    if (!err) { err = document.createElement('span'); err.className = 'field__error'; err.id = id + '-err'; field.appendChild(err); }
    err.textContent = msg;
    field.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', err.id);
  };
  Object.values(fields).forEach((id) => document.getElementById(id).addEventListener('input', () => setError(id, '')));

  const spam = /http[s]?:\/\/|www\.|<script|onclick|viagra|casino|free money|earn \$|make money fast/i;
  const rateOk = () => {
    try {
      const now = Date.now();
      const list = JSON.parse(sessionStorage.getItem('form_submissions') || '[]').filter((t) => now - t < 600000);
      if (list.length >= 3) return false;
      list.push(now); sessionStorage.setItem('form_submissions', JSON.stringify(list));
    } catch (_) { /* storage unavailable: allow */ }
    return true;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = ''; status.className = 'form__status';
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    let ok = true;

    if (!/^[\p{L}\s'.-]{2,60}$/u.test(name)) { setError(fields.name, name ? 'Use letters only (2–60 characters).' : 'Please enter your name.'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError(fields.email, email ? 'Please enter a valid email address.' : 'Please enter your email.'); ok = false; }
    if (message.length < 10) { setError(fields.message, message ? 'Message is too short (minimum 10 characters).' : 'Please write a message.'); ok = false; }
    else if (message.length > 2000) { setError(fields.message, 'Message is too long (maximum 2000 characters).'); ok = false; }
    else if (spam.test(message) || spam.test(name)) { setError(fields.message, 'Please remove links from your message.'); ok = false; }
    if (!ok) return;
    if (!rateOk()) { status.textContent = 'Too many messages. Please wait a few minutes and try again.'; status.classList.add('is-err'); return; }

    const btn = form.querySelector('button[type="submit"]');
    const label = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        form.reset();
        status.textContent = 'Thanks, your message was sent. I\'ll get back to you soon.';
        status.classList.add('is-ok');
      } else {
        const data = await res.json().catch(() => ({}));
        status.textContent = data?.errors?.[0]?.message || 'Something went wrong. Please email me directly.';
        status.classList.add('is-err');
      }
    } catch (_) {
      status.textContent = 'Network error. Check your connection or email me directly.';
      status.classList.add('is-err');
    } finally {
      btn.disabled = false; btn.innerHTML = label;
    }
  });

  /* ── About: split the lead paragraph into words for the scroll-lit reveal ── */
  const lead = document.querySelector('[data-words]');
  let words = [];
  if (lead) {
    lead.innerHTML = lead.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    words = [...lead.querySelectorAll('.w')];
    if (reduceMotion) words.forEach((w) => w.classList.add('is-lit'));
  }

  /* ── Certificates: stagger index for the slide-in ── */
  document.querySelectorAll('.certs li').forEach((li, i) => li.style.setProperty('--i', i));

  /* ── Scroll progress (--sp, 0 → 1) for scroll-driven 3D and reveals ── */
  const scrollEls = [...document.querySelectorAll('[data-scroll]')];
  const xpItems = [...document.querySelectorAll('.xp__list li')];
  const updateScroll = () => {
    const vh = window.innerHeight;
    scrollEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      let p;
      if (el.matches('.xp__list, [data-words], .journey')) {
        // reading progress: starts when the top reaches 80% of the screen, ends when the bottom reaches 55%
        p = (vh * 0.8 - r.top) / (r.height + vh * 0.25);
      } else {
        // entrance progress: 0 when the top enters the screen, 1 when it reaches 35% from the top
        p = (vh - r.top) / (vh * 0.65);
      }
      p = Math.max(0, Math.min(1, p));
      el.style.setProperty('--sp', p.toFixed(3));
      if (el.classList.contains('journey')) {
        const steps = el.querySelectorAll('.journey__step');
        steps.forEach((s, i) => s.classList.toggle('is-lit', p * steps.length > i + 0.15));
      }
      if (el === lead) {
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
      }
    });
    xpItems.forEach((li) => li.classList.toggle('is-lit', li.getBoundingClientRect().top < vh * 0.7));
  };
  if (reduceMotion) {
    scrollEls.forEach((el) => el.style.setProperty('--sp', '1'));
    xpItems.forEach((li) => li.classList.add('is-lit'));
    document.querySelectorAll('.journey__step').forEach((s) => s.classList.add('is-lit'));
  } else {
    let ticking = false;
    const onScrollFx = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateScroll(); ticking = false; });
    };
    window.addEventListener('scroll', onScrollFx, { passive: true });
    window.addEventListener('resize', onScrollFx);
    updateScroll();
  }

  /* ── 3D tilt + cursor light on cards ── */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      const max = parseFloat(el.dataset.tilt) || 6;
      let raf = 0;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.classList.add('is-tilting');
          el.style.setProperty('--ty', ((x - 0.5) * max).toFixed(2) + 'deg');
          el.style.setProperty('--tx', ((0.5 - y) * max).toFixed(2) + 'deg');
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        el.classList.remove('is-tilting');
        el.style.setProperty('--tx', '0deg');
        el.style.setProperty('--ty', '0deg');
      });
    });
  }

  /* ── Mekeni phones: the group of three tilts toward the cursor ── */
  const phonesEl = document.querySelector('.phones[data-scroll]');
  if (phonesEl && finePointer && !reduceMotion) {
    const area = phonesEl.closest('.story') || phonesEl;
    let raf = 0;
    area.addEventListener('pointermove', (e) => {
      const r = phonesEl.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        phonesEl.style.setProperty('--py', Math.max(-1, Math.min(1, x)) * 10 + 'deg');
        phonesEl.style.setProperty('--px', Math.max(-1, Math.min(1, -y)) * 6 + 'deg');
      });
    });
    area.addEventListener('pointerleave', () => { phonesEl.style.setProperty('--py', '0deg'); phonesEl.style.setProperty('--px', '0deg'); });
  }

  /* ── Hero scene on touch screens: drag to tilt, and tilt with the phone's motion ── */
  const scene = document.getElementById('scene');
  if (scene && rig && !finePointer && !reduceMotion) {
    const clamp = (v, a) => Math.max(-a, Math.min(a, v));
    let dragging = false, sx = 0, sy = 0, raf = 0;
    const setTilt = (ry, rx) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        rig.style.setProperty('--ry', ry.toFixed(1) + 'deg');
        rig.style.setProperty('--rx', rx.toFixed(1) + 'deg');
      });
    };
    scene.addEventListener('pointerdown', (e) => {
      dragging = true; sx = e.clientX; sy = e.clientY;
      rig.classList.add('is-dragging');
    });
    scene.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      setTilt(-14 + clamp((e.clientX - sx) * 0.3, 40), 4 - clamp((e.clientY - sy) * 0.15, 18));
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      rig.classList.remove('is-dragging');
      rig.style.removeProperty('--ry'); rig.style.removeProperty('--rx');
    };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => scene.addEventListener(t, release));

    // Device motion: Android starts right away; iPhone asks once, on the first touch of the scene
    const onOrient = (e) => {
      if (dragging || e.gamma == null) return;
      const heroBox = document.getElementById('home').getBoundingClientRect();
      if (heroBox.bottom < 0) return; // only while the hero is on screen
      rig.classList.add('is-orienting');
      setTilt(-14 + clamp(e.gamma, 25) * 0.9, 4 + clamp((e.beta || 45) - 45, 20) * 0.4);
    };
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      scene.addEventListener('pointerdown', () => {
        DOE.requestPermission().then((s) => { if (s === 'granted') window.addEventListener('deviceorientation', onOrient); }).catch(() => {});
      }, { once: true });
    } else if (DOE) {
      window.addEventListener('deviceorientation', onOrient);
    }
  }

  /* ── Footer year ── */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
