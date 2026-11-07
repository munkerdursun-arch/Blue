// =====================================================================
// Nocturne « + » — couche d'animations supplémentaires, chargée seulement
// quand <html data-mode="plus">. Tout reste désactivé si l'utilisateur
// demande moins de mouvement.
// =====================================================================

const PALETTE = ['#ff6b52', '#ffc552', '#5ce6bd', '#619eff', '#bd85ff'];

export function initPlus({ gsap, ScrollTrigger, onScroll, scene, heroChars, contactChars, manifestoWords, finePointer }) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  scene?.setBoost(true); // la sculpture tourne avec la vitesse de défilement

  // ---------- 1. Traînée de couleur derrière le curseur + gerbe au clic ----------
  if (finePointer) {
    const cv = document.createElement('canvas');
    cv.className = 'trail';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let dpr = 1;
    const size = () => {
      dpr = Math.min(devicePixelRatio, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener('resize', size);

    const pts = [];      // points de la traînée
    const sparks = [];   // particules du clic
    let hue = 0, raf = 0, last = performance.now();
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); } };

    addEventListener('pointermove', (e) => {
      pts.push({ x: e.clientX, y: e.clientY, life: 1, c: PALETTE[Math.floor(hue) % PALETTE.length] });
      hue += 0.12;
      if (pts.length > 64) pts.shift();
      kick();
    });
    addEventListener('pointerdown', (e) => {
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
        const v = 3 + Math.random() * 5;
        sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, life: 1, r: 2 + Math.random() * 4, c: PALETTE[i % PALETTE.length] });
      }
      kick();
    });

    function draw(now) {
      const dt = Math.min((now - last) / 16.67, 3); // 1 = une image à 60 i/s
      last = now;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      // ruban : chaque point rétrécit et s'efface
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.life -= 0.022 * dt;
        if (p.life <= 0) continue;
        const r = 16 * p.life * (i / pts.length);
        ctx.globalAlpha = p.life * 0.7;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }
      while (pts.length && pts[0].life <= 0) pts.shift();
      // étincelles : vitesse, gravité, frottement
      for (const s of sparks) {
        s.vy += 0.18 * dt; s.vx *= 0.97; s.vy *= 0.97;
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= 0.022 * dt;
        if (s.life <= 0) continue;
        ctx.globalAlpha = s.life;
        ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
      ctx.globalAlpha = 1;
      // on arrête la boucle quand il n'y a plus rien à dessiner (économie d'énergie)
      raf = pts.length || sparks.length ? requestAnimationFrame(draw) : 0;
    }
  }

  // ---------- 2. Titre d'accueil : ondulation au repos, envol au défilement ----------
  document.addEventListener('intro:done', () => {
    gsap.to(heroChars, {
      yPercent: -5, duration: 1.8, ease: 'sine.inOut', repeat: -1, yoyo: true,
      stagger: { each: 0.09, from: 'start' },
    });
  }, { once: true });
  // chaque lettre part dans sa propre direction (valeurs fixées au hasard une fois)
  heroChars.forEach((c) => {
    gsap.to(c, {
      y: () => -120 - Math.random() * 260,
      x: () => (Math.random() - 0.5) * 160,
      rotation: (Math.random() - 0.5) * 70,
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: 0.8 },
    });
  });
  gsap.to('.hero__aside', {
    y: -80, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '20% top', end: 'bottom 30%', scrub: 0.8 },
  });

  // ---------- 3. Manifeste : les mots montent en plus de s'allumer ----------
  gsap.from(manifestoWords, {
    yPercent: 60, rotation: 3, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 85%', end: 'bottom 55%', scrub: 0.6 },
  });

  // ---------- 4. Textes qui se « décodent » à l'entrée ----------
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—/·';
  function scramble(el) {
    const final = el.dataset.final ?? el.textContent;
    el.dataset.final = final;
    const state = { p: 0 };
    gsap.to(state, {
      p: 1, duration: 1.1, ease: 'power2.out',
      onUpdate: () => {
        const n = Math.floor(state.p * final.length);
        el.textContent = final.slice(0, n) + [...final.slice(n)].map((ch) => (ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
      },
      onComplete: () => { el.textContent = final; },
    });
  }
  $$('.eyebrow, .project__year, .stat__label').forEach((el) => {
    el.setAttribute('aria-label', el.textContent);
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => scramble(el) });
  });

  // ---------- 5. Liens dont le texte roule au survol ----------
  $$('.socials a, .menu__foot a').forEach((el) => {
    const text = el.textContent.trim();
    el.innerHTML = `<span class="roll" aria-hidden="true"><span class="roll__in"><span>${text}</span><span>${text}</span></span></span><span class="sr-only">${text}</span>`;
  });

  // ---------- 6. Entrées en cascade ----------
  gsap.from('.project', {
    y: 70, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09,
    scrollTrigger: { trigger: '.work__list', start: 'top 80%' },
  });
  gsap.from('.stat', {
    y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12,
    scrollTrigger: { trigger: '.stats', start: 'top 75%' },
  });
  gsap.from('.contact__foot > *', {
    y: 20, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.contact__foot', start: 'top 95%' },
  });

  // ---------- 7. Lettres du contact qui sautent au survol ----------
  if (finePointer) {
    contactChars.forEach((c) => {
      c.addEventListener('pointerenter', () => {
        if (gsap.isTweening(c)) return;
        gsap.timeline()
          .to(c, { y: -28, scaleY: 1.08, duration: 0.22, ease: 'power2.out' })
          .to(c, { y: 0, scaleY: 1, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
      });
    });
  }

  // ---------- 8. Panneaux d'expertise inclinés selon la vitesse ----------
  const setPanelSkew = gsap.quickTo('.panel', 'skewX', { duration: 0.5, ease: 'power3.out' });
  onScroll((_, v) => setPanelSkew(gsap.utils.clamp(-8, 8, -v * 0.25)));

  // ---------- 9. Badge : tourne plus vite quand on défile ----------
  const badge = $('.hero__badge'); // (le SVG garde sa rotation CSS ; on fait tourner le conteneur)
  if (badge) {
    const setRot = gsap.quickTo(badge, 'rotation', { duration: 0.8, ease: 'power3.out' });
    let rot = 0;
    onScroll((_, v) => { rot += v * 0.6; setRot(rot); });
  }
}
