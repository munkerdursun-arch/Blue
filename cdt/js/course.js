/* =====================================================================
   Formation CDT : outils interactifs de la formation (vue administrateur).
   Repris du site d'origine : fiches d'agents (versions Standard / n8n /
   Paperclip), prompts flash, onglets d'outils, calculateur de gains, FAQ,
   glossaire, programme suivi. Les données sont chargées depuis la base.
   ===================================================================== */
export function initCourse(D) {
  const { AGENTS, FLASH, GAINS, FAQ, GLOSS, PROG } = D;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

  /* ---------- copie ---------- */
  function copyText(btn,text){
    const ok=()=>{const t=btn.textContent;btn.textContent="Copié";btn.classList.add("done");setTimeout(()=>{btn.textContent=t==="Copié"?"Copier":t;btn.classList.remove("done")},1500)};
    const fallback=()=>{const pre=btn.closest(".code")?.querySelector("pre");if(pre){const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent="Sélectionné : Ctrl+C"}};
    try{navigator.clipboard.writeText(text).then(ok,fallback)}catch(e){fallback()}
  }
  document.addEventListener("click",e=>{
    const b=e.target.closest(".cp");if(!b)return;
    const src=b.dataset.copy?document.getElementById(b.dataset.copy):b.closest(".code").querySelector("pre");
    copyText(b,src.textContent);
  });
  function codeBlock(label,text,extra=""){
    const d=document.createElement("div");d.className="code";
    d.innerHTML=`<div class="ch"><span>${esc(label)}</span><span style="display:flex;gap:6px;flex-wrap:wrap">${extra}<button class="cp" type="button">Copier</button></span></div><pre></pre>`;
    d.querySelector("pre").textContent=text;return d;
  }

  /* ---------- prompts flash ---------- */
  FLASH.forEach(([t,p])=>{const b=document.createElement("div");b.className="box";b.innerHTML=`<h4>${esc(t)}</h4>`;b.appendChild(codeBlock("prompt",p));$("#flash").appendChild(b)});

  /* ---------- agents ---------- */
  const N8N_HEAD=`# MODE AUTOMATIQUE (n8n)
  Tu travailles sans interlocuteur : ignore toute consigne qui te demande de poser des questions ou d'attendre.
  Si une information manque, écris [À COMPLÉTER : ...] dans le texte et liste les manques en fin de réponse.
  Tu produis un BROUILLON qui sera relu par un humain avant tout envoi.
  Réponds uniquement avec le contenu demandé, sans commentaire avant ou après.

  `;
  const pcSpecialist=a=>document.getElementById("pcspe").textContent.replace("[CDT-0X Nom de l'agent]","CDT-"+a.id+" "+a.nom).replace(/\[Collez ici[^\]]*\]/,"Les étapes \"ATTENDS mes réponses\" ci-dessous sont remplacées par des commentaires sur le ticket.\n\n"+a.prompt);
  const lvlPill=l=>l===1?'<span class="pill p1">Niveau 1</span>':l===2?'<span class="pill p2">Niveau 1 → n8n</span>':'<span class="pill p3">Niveau 1 → Paperclip</span>';
  const phases=["Toutes",...new Set(AGENTS.map(a=>a.phase))];let curPhase="Toutes";
  phases.forEach(p=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=p;b.setAttribute("aria-pressed",p==="Toutes");b.onclick=()=>{curPhase=p;$$("#agfilters .chip").forEach(c=>c.setAttribute("aria-pressed",c===b));filterAgents()};$("#agfilters").appendChild(b)});
  AGENTS.forEach(a=>{
    const d=document.createElement("details");d.className="ag";d.id="agent-"+a.id;d.dataset.phase=a.phase;
    d.innerHTML=`<summary><span class="id">${a.id}</span><span class="nm"><b>${esc(a.nom)}</b><span>${esc(a.mission)}</span></span><span class="tags"><span class="pill">${esc(a.phase)}</span>${lvlPill(a.lvl)}</span></summary>
    <div class="in">
      <div class="kv">
        <div class="k">Où l'installer</div><div>${esc(a.outil)} Nom conseillé : <code>CDT-${a.id} ${esc(a.nom)} v1</code>.</div>
        <div class="k">Fichiers à joindre</div><div><ul>${a.fichiers.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
        <div class="k">Questions qu'il pose</div><div><ul>${a.questions.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>
        <div class="k">Sortie attendue</div><div>${esc(a.sortie)}</div>
        <div class="k">Automatisation</div><div>${esc(a.auto)}</div>
      </div>
      <div class="slot-prompt"></div>
      <div class="slot-start"></div>
      <div class="call warn"><b class="h">Garde-fous</b><ul style="padding-left:18px">${a.garde.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>
    </div>`;
    const versions={std:a.prompt,n8n:N8N_HEAD+a.prompt,pc:a.id==="15"?document.getElementById("pcceo").textContent:pcSpecialist(a)};
    const labels={std:"Instructions · Claude, ChatGPT, Gemini, Copilot, Le Chat",n8n:"System Message · nœud AI Agent n8n",pc:"AGENTS.md · Paperclip"};
    const sw=`<button class="vb" type="button" data-v="std" aria-pressed="true">Standard</button><button class="vb" type="button" data-v="n8n" aria-pressed="false">Version n8n</button><button class="vb" type="button" data-v="pc" aria-pressed="false">Version Paperclip</button>`;
    const cb=codeBlock(labels.std,versions.std,sw);
    cb.querySelectorAll("[data-v]").forEach(btn=>btn.addEventListener("click",()=>{const v=btn.dataset.v;cb.querySelector("pre").textContent=versions[v];cb.querySelector(".ch>span").textContent=labels[v];cb.querySelectorAll("[data-v]").forEach(x=>x.setAttribute("aria-pressed",x===btn))}));
    d.querySelector(".slot-prompt").appendChild(cb);
    d.querySelector(".slot-start").appendChild(codeBlock("Message de démarrage · à coller dans une nouvelle conversation",a.demarrage));
    $("#aglist").appendChild(d);
  });
  function filterAgents(){
    const q=$("#agsearch").value.trim().toLowerCase();let n=0;
    $$("details.ag").forEach(d=>{const show=(curPhase==="Toutes"||d.dataset.phase===curPhase)&&(!q||d.textContent.toLowerCase().includes(q));d.hidden=!show;if(show)n++});
    $("#agempty").hidden=n>0;
  }
  $("#agsearch").addEventListener("input",filterAgents);

  /* table outil par agent */
  AGENTS.forEach(a=>{const r=$("#maptable").insertRow();r.innerHTML=`<td class="k"><a href="#agent-${a.id}">${a.id} · ${esc(a.nom)}</a></td><td>${esc(a.outil.split(".")[0])}</td><td>${lvlPill(a.lvl)}</td>`});
  document.addEventListener("click",e=>{const l=e.target.closest('a[href^="#agent-"]');if(!l)return;const d=document.querySelector(l.getAttribute("href"));if(d){d.hidden=false;d.open=true}});

  /* ---------- onglets ---------- */
  const tabs=$$("#tooltabs [role=tab]");
  function selTab(t){tabs.forEach(x=>{const on=x===t;x.setAttribute("aria-selected",on);x.tabIndex=on?0:-1;document.getElementById(x.getAttribute("aria-controls")).hidden=!on});store.set("cdt_tab",t.id)}
  tabs.forEach((t,i)=>{t.addEventListener("click",()=>selTab(t));t.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){const n=tabs[(i+(e.key==="ArrowRight"?1:tabs.length-1))%tabs.length];selTab(n);n.focus()}})});
  {const s=store.get("cdt_tab",null);const t=s&&document.getElementById(s);if(t)selTab(t)}

  /* ---------- gains ---------- */
  const fmt=n=>Math.round(n).toLocaleString("fr-FR");
  let G=store.get("cdt_gains",null)||GAINS.map(g=>g.slice());let rate=store.get("cdt_rate",55);$("#rate").value=rate;
  function buildGains(){
    $$("#gaintable tr.gr").forEach(r=>r.remove());
    G.forEach((g,i)=>{const r=$("#gaintable").insertRow();r.className="gr";r.innerHTML=`<td>${esc(g[0])}</td>`+[1,2,3].map(j=>`<td><input class="fld" type="number" min="0" step="0.5" id="g${i}_${j}" value="${g[j]}" aria-label="${esc(g[0])}"></td>`).join("")+`<td class="num" id="gh${i}"></td><td class="num" id="ge${i}"></td>`;
      [1,2,3].forEach(j=>r.querySelector(`#g${i}_${j}`).addEventListener("input",ev=>{G[i][j]=parseFloat(ev.target.value)||0;store.set("cdt_gains",G);calc()}))});
    calc();
  }
  function calc(){let H=0;G.forEach((g,i)=>{const h=g[1]*(g[2]-g[3]);H+=h;$("#gh"+i).textContent=fmt(h)+" h";$("#ge"+i).textContent=fmt(h*rate)+" €"});$("#tH").textContent=fmt(H)+" h";$("#tE").textContent=fmt(H*rate)+" €";$("#tY").textContent=fmt(H*rate*11)+" €"}
  $("#rate").addEventListener("input",e=>{rate=parseFloat(e.target.value)||0;store.set("cdt_rate",rate);calc()});
  $("#gainreset").onclick=()=>{G=GAINS.map(g=>g.slice());rate=55;$("#rate").value=55;store.set("cdt_gains",G);store.set("cdt_rate",55);buildGains()};
  buildGains();

  /* ---------- FAQ, glossaire ---------- */
  FAQ.forEach(([q,a])=>{const d=document.createElement("details");d.className="fq";d.innerHTML=`<summary>${esc(q)}</summary><div><p>${esc(a)}</p></div>`;$("#faqlist").appendChild(d)});
  GLOSS.forEach(([t,d])=>{const e=document.createElement("div");e.innerHTML=`<b>${esc(t)}</b>${esc(d)}`;$("#gl").appendChild(e)});

  /* (navigation et thème : gérés par studio.js) */
  let FORM=store.get("cdt_formula","16");if(!PROG[FORM])FORM="16";
  function renderProg(){
    $$("#programme .seg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.f===FORM));
    $("#fdesc").textContent=PROG[FORM].desc;
    const S=store.get("cdt_prog_"+FORM,{});const box=$("#sched");box.innerHTML="";let k=0;
    PROG[FORM].days.forEach(d=>{
      const h=document.createElement("h3");h.textContent=d.t;box.appendChild(h);
      const w=document.createElement("div");w.className="tw";w.style.marginTop="10px";
      const t=document.createElement("table");t.className="wk";t.innerHTML="<tr><th>✓</th><th>Horaire</th><th>Séquence</th><th>Durée</th><th>Ce que vous faites</th></tr>";
      d.rows.forEach(r=>{const tr=t.insertRow();
        if(r[0]==="brk"){tr.className="brk";tr.innerHTML=`<td></td><td class="t">${r[1]}</td><td colspan="3">${r[2]}</td>`;return}
        const i=k++;tr.innerHTML=`<td><input type="checkbox" id="pg${FORM}_${i}" aria-label="${esc(r[1])} faite"></td><td class="t">${r[0]}</td><td><a href="${r[2]}">${esc(r[1])}</a></td><td class="num" style="white-space:nowrap">${r[3]}</td><td>${esc(r[4])}</td>`;
        const c=tr.querySelector("input");c.checked=!!S[i];tr.classList.toggle("done",c.checked);
        c.onchange=()=>{S[i]=c.checked;tr.classList.toggle("done",c.checked);store.set("cdt_prog_"+FORM,S);prog()}});
      w.appendChild(t);box.appendChild(w);
    });
    prog();
  }
  function prog(){const n=$$("#sched input:checked").length,tot=$$("#sched input").length,p=tot?Math.round(n/tot*100):0;const set=(id,f)=>{const e=document.getElementById(id);if(e)f(e)};set("pct",e=>e.textContent=p+" %");set("navpct",e=>e.textContent=p+" %");set("navbar",e=>e.style.width=p+"%")}
  $$("#programme .seg button").forEach(b=>b.onclick=()=>{FORM=b.dataset.f;store.set("cdt_formula",FORM);renderProg()});
  renderProg();
}
