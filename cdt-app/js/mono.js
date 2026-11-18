// =====================================================================
// Mode « une seule IA autorisée » : l'administrateur choisit l'outil de
// l'entreprise (Copilot, ChatGPT, Claude, Gemini, Le Chat) et toute la
// formation s'adapte : onglets d'installation, fiches des agents,
// tableau « quel outil pour quel agent », comparatif. Choix mémorisé.
// Gère aussi l'impression de la fiche réflexe.
// =====================================================================
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CHAT_TABS = ['tb-claude', 'tb-gpt', 'tb-gem', 'tb-cop', 'tb-mis', 'tb-nlm'];

export function initMono(D, root) {
  const MONO = D.MONO || {};
  let cur = '';
  try { cur = localStorage.getItem('cdt_mono') || ''; } catch { /* stockage indisponible */ }
  if (cur && !MONO[cur]) cur = '';

  // une ligne « Dans votre IA » ajoutée à chaque fiche d'agent (une seule fois)
  root.querySelectorAll('details.ag .kv').forEach((kv) => {
    if (kv.querySelector('[data-mono-row]')) return;
    kv.insertAdjacentHTML('afterbegin', '<div class="k" data-mono-row hidden>Dans votre IA</div><div data-mono-row data-mono-val hidden></div>');
  });

  const comparatif = () => `<div class="tw"><table><tr><th>IA autorisée</th><th>Où vivent les agents</th><th>Automatiser</th><th>Équipe d'agents</th><th>Point d'attention</th></tr>
    ${Object.values(MONO).map((t) => `<tr><td class="k">${esc(t.label)}</td><td>${esc(t.home)}</td><td>${esc(t.auto)}</td><td>${esc(t.team)}</td><td>${esc(t.watch)}</td></tr>`).join('')}</table></div>`;
  const fiche = (t) => `<div class="kv">
      <div class="k">Où vivent les agents</div><div>${esc(t.home)}</div>
      <div class="k">Fichiers permanents</div><div>${esc(t.files)}</div>
      <div class="k">Points forts</div><div>${esc(t.strengths)}</div>
      <div class="k">Automatiser</div><div>${esc(t.auto)}</div>
      <div class="k">Équipe d'agents</div><div>${esc(t.team)}</div>
      <div class="k">Attention</div><div>${esc(t.watch)}</div></div>
    <div class="call info"><b class="h">Toute la formation est réglée sur ${esc(t.label)}</b><p>Les onglets du module 06, les fiches des agents (module 07) et le tableau « quel outil pour quel agent » n'affichent plus que votre outil. Pas de fonction projet ou agent disponible ? Utilisez le kit de démarrage ci-dessous.</p></div>`;

  function apply() {
    const t = MONO[cur];
    root.querySelectorAll('#monopick [data-mono]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mono === cur)));
    // onglets d'installation : seulement l'outil autorisé (+ NotebookLM avec Gemini), n8n et Paperclip restent
    // n8n et Paperclip sont remplacés par les outils de l'IA choisie (bannières des modules 10 et 11)
    const tabs = [...root.querySelectorAll('#tooltabs [role=tab]')];
    tabs.forEach((tb) => { tb.hidden = !!t && tb.id !== t.tab && !(cur === 'gemini' && tb.id === 'tb-nlm'); });
    const panels = [...root.querySelectorAll('#installer [role=tabpanel]')];
    const visible = tabs.filter((x) => !x.hidden);
    if (!visible.length) panels.forEach((p) => { p.hidden = true; });          // IA interne : pas d'onglet dédié
    else {
      const sel = tabs.find((x) => x.getAttribute('aria-selected') === 'true');
      if (!sel || sel.hidden || panels.every((p) => p.hidden)) visible[0].click();
    }
    const note = root.querySelector('#mononote');
    if (note) {
      note.hidden = !t;
      if (t) note.innerHTML = t.tab
        ? `Réglé sur <b>${esc(t.label)}</b> (module 04). Automatisation et équipe d'agents : l'équivalent dans votre IA est donné aux modules 10 et 11.`
        : `Réglé sur <b>${esc(t.label)}</b> (module 04). Installez chaque agent selon les réponses de la DSI : assistant avec instructions permanentes, ou kit de démarrage collé en premier message.`;
    }
    // fiches des agents
    root.querySelectorAll('[data-mono-row]').forEach((e) => { e.hidden = !t; });
    if (t) root.querySelectorAll('[data-mono-val]').forEach((e) => { e.innerHTML = `<b>${esc(t.label)}</b> : ${esc(t.home)} Sans fonction projet ou agent : kit de démarrage (module 04).`; });
    // tableau « quel outil pour quel agent »
    root.querySelectorAll('#maptable tr').forEach((tr, i) => {
      const c = tr.cells[1]; if (!c) return;
      if (tr.dataset.orig === undefined) tr.dataset.orig = c.textContent;
      c.textContent = t ? (i === 0 ? 'Dans votre IA' : t.label) : tr.dataset.orig;
    });
    // équivalents de n8n (niveau 2) et de Paperclip (niveau 3)
    const lvl = (k, title, other) => root.querySelectorAll(`[data-mono-${k}]`).forEach((e) => {
      e.hidden = !t;
      if (t) e.innerHTML = `<div class="call info"><b class="h">Votre IA : ${esc(t.label)}</b><p><b>${title}</b> ${esc(t[k])}</p><p class="muted">${other}</p></div>`;
    });
    lvl('l2', 'Automatiser sans n8n :', 'La suite de ce module (n8n) ne sert que si votre DSI autorise n8n et l\'API de votre fournisseur. Le principe reste le même : déclencheur, étape IA, brouillon ou approbation, trace.');
    lvl('l3', 'Équipe d\'agents sans Paperclip :', 'La suite de ce module (Paperclip) ne sert que si votre DSI l\'autorise. Le principe reste le même : chef d\'orchestre, tâches, validations par vous, historique.');
    const lv = root.querySelector('#monolevels');
    if (lv) {
      const list = t ? [t] : Object.values(MONO);
      lv.innerHTML = `<div class="tw"><table><tr><th>IA</th><th>Niveau 2 · Automatiser (à la place de n8n)</th><th>Niveau 3 · Équipe d'agents (à la place de Paperclip)</th></tr>${list.map((x) => `<tr><td class="k">${esc(x.label)}</td><td>${esc(x.l2 || '')}</td><td>${esc(x.l3 || '')}</td></tr>`).join('')}</table></div>`;
    }
    const box = root.querySelector('#monoinfo');
    if (box) box.innerHTML = t ? fiche(t) : `<p class="muted" style="margin-bottom:12px">Comparatif des cinq IA les plus autorisées en entreprise. Choisissez la vôtre pour régler toute la formation.</p>${comparatif()}`;
    document.querySelectorAll('[data-mono-badge]').forEach((e) => { e.textContent = t ? t.label : 'toutes les IA'; });
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mono]');
    if (b) { cur = b.dataset.mono; try { localStorage.setItem('cdt_mono', cur); } catch { /* ignoré */ } apply(); return; }
    if (e.target.closest('[data-print]')) {
      document.body.classList.add('print-reflexe');
      setTimeout(() => { window.print(); document.body.classList.remove('print-reflexe'); }, 60);
    }
  });
  apply();
}
