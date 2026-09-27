const $ = (sel) => document.querySelector(sel);

const ATRIBUTOS = [
  ["ataque", "Ataque"],
  ["defensa", "Defensa"],
  ["fuerza", "Fuerza*"],
  ["agilidad", "Agilidad"],
  ["ferocidad", "Ferocidad"],
  ["resistencia", "Resistencia"],
  ["inteligencia", "Inteligencia"],
];

let ultimaPelea = null;

const byId = Object.fromEntries(LUCHADORES.map((f) => [f.id, f]));

const state = {
  a: byId.gorila,
  b: byId.tigre,
  arena: "selva",
  arma: { a: null, b: null },
  pickingSide: null,
  pickerCat: "todos",
  rosterCat: "todos",
};

/* ───── almacenamiento local (votos) ───── */
function leerVotos() {
  try {
    return JSON.parse(localStorage.getItem("qg-votos") || "{}");
  } catch {
    return {};
  }
}
function guardarVotos(v) {
  try {
    localStorage.setItem("qg-votos", JSON.stringify(v));
  } catch {}
}
function claveDuelo() {
  return [state.a.id, state.b.id].sort().join("|") + "@" + state.arena;
}

/* ───── helpers ───── */
function fmt(n) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}
function tamanoCorto(f) {
  return f.enjambre ? f.cantidad : fmtPeso(f.peso);
}
function chips(container, items, activo, onClick) {
  container.innerHTML = "";
  for (const [key, label] of items) {
    const b = document.createElement("button");
    b.className = "chip" + (key === activo ? " active" : "");
    b.textContent = label;
    b.onclick = () => onClick(key);
    container.appendChild(b);
  }
}
const itemsCategorias = () => [["todos", "Todos"], ...Object.entries(CATEGORIAS).map(([k, c]) => [k, c.nombre])];

function barras(f) {
  return ATRIBUTOS.map(
    ([k, label]) => `
      <div class="bar-row"><span>${label}</span>
        <div class="bar"><i style="width:${f[k]}%"></i></div><b>${f[k]}</b></div>`
  ).join("");
}

function datosReales(f) {
  return `
    <ul class="facts">
      <li><span>Peso</span><b>${fmtPeso(f.peso)}</b></li>
      <li><span>Tamaño</span><b>${fmt(f.largo)} m</b></li>
      <li><span>Velocidad</span><b>${fmt(f.velocidad)} km/h</b></li>
      <li><span>Mordida</span><b>${f.mordida ? fmt(f.mordida) + " PSI" : "—"}</b></li>
    </ul>`;
}

/* ───── arena ───── */
function renderArenas() {
  chips($("#arenas"), Object.entries(ARENAS).map(([k, a]) => [k, a.nombre]), state.arena, (k) => {
    state.arena = k;
    renderArenas();
    renderArmaInfo("a");
    renderArmaInfo("b");
    ocultarResultado();
  });
  $("#arena-desc").textContent = ARENAS[state.arena].desc;
  document.body.dataset.arena = state.arena;
}

/* ───── slots ───── */
function renderSlot(side) {
  const f = state[side];
  const el = $("#slot-" + side);
  el.innerHTML = `
    <span class="big-emoji cat-${f.categoria}">${f.emoji}</span>
    <strong>${f.nombre}</strong>
    <small>${tamanoCorto(f)} · ${CATEGORIAS[f.categoria].nombre}</small>
    <em>Cambiar luchador</em>`;
}

function renderSlots() {
  renderSlot("a");
  renderSlot("b");
  renderArmaInfo("a");
  renderArmaInfo("b");
}

/* ───── armas ───── */
function initArmas() {
  for (const side of ["a", "b"]) {
    const sel = $("#arma-" + side);
    sel.innerHTML =
      `<option value="">Sin arma</option>` +
      Object.entries(ARMAS).map(([k, w]) => `<option value="${k}">${w.emoji} ${w.nombre}</option>`).join("");
    sel.onchange = () => {
      state.arma[side] = sel.value || null;
      renderArmaInfo("a");
      renderArmaInfo("b");
      ocultarResultado();
    };
  }
}

function renderArmaInfo(side) {
  const id = state.arma[side];
  $("#arma-" + side).value = id || "";
  const el = $("#arma-info-" + side);
  if (!id) {
    el.innerHTML = "";
    return;
  }
  const otro = side === "a" ? "b" : "a";
  const pct = Math.round(probUsoArma(state[side], id) * 100);
  const [sin, con] = impactoArma(state[side], state[otro], state.arena, id, state.arma[otro], side === "a");
  el.innerHTML = `
    <span class="uso ${pct >= 90 ? "alto" : pct >= 30 ? "medio" : "bajo"}">Sabe usarla: ${pct}%</span>
    <span class="impacto">Gana ${Math.round(sin * 100)}% <b>→ ${Math.round(con * 100)}%</b> si la usa</span>`;
}

/* ───── picker ───── */
function abrirPicker(side) {
  state.pickingSide = side;
  $("#picker-title").textContent = side === "a" ? "Esquina roja" : "Esquina azul";
  $("#picker-search").value = "";
  renderPicker();
  $("#picker").showModal();
  $("#picker-search").focus();
}

function renderPicker() {
  chips($("#picker-filters"), itemsCategorias(), state.pickerCat, (k) => {
    state.pickerCat = k;
    renderPicker();
  });
  const q = $("#picker-search").value.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const otro = state[state.pickingSide === "a" ? "b" : "a"];
  const lista = LUCHADORES.filter(
    (f) =>
      (state.pickerCat === "todos" || f.categoria === state.pickerCat) &&
      (!q || f.nombre.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(q))
  );
  const cont = $("#picker-list");
  cont.innerHTML = "";
  for (const f of lista) {
    const b = document.createElement("button");
    b.className = "pick" + (f.id === otro.id ? " disabled" : "");
    b.disabled = f.id === otro.id;
    b.innerHTML = `<span>${f.emoji}</span><strong>${f.nombre}</strong><small>${tamanoCorto(f)}</small>`;
    b.onclick = () => {
      state[state.pickingSide] = f;
      $("#picker").close();
      renderSlots();
      ocultarResultado();
    };
    cont.appendChild(b);
  }
  if (!lista.length) cont.innerHTML = `<p class="muted">Nadie con ese nombre… todavía.</p>`;
}

/* ───── pelea ───── */
function ocultarResultado() {
  if (pelea.actual) pelea.actual.cancelar();
  ultimaPelea = null;
  $("#result").hidden = true;
  $("#compare").hidden = true;
}

function razonesArmas() {
  const out = [];
  for (const side of ["a", "b"]) {
    const id = state.arma[side];
    if (!id) continue;
    const f = state[side];
    const w = ARMAS[id];
    const pct = Math.round(probUsoArma(f, id) * 100);
    const extra = HABILIDAD_ARMAS[f.id] ? " " + HABILIDAD_ARMAS[f.id][1] : "";
    const otro = side === "a" ? "b" : "a";
    const [sin, con] = impactoArma(f, state[otro], state.arena, id, state.arma[otro], side === "a");
    out.push({
      favorece: f.id,
      texto: `${w.emoji} ${f.nombre} tiene ${w.articulo}: ${pct}% de probabilidad de saber usarl${w.lo === "la" ? "a" : "o"}. Si lo logra, sus chances pasan de ${Math.round(sin * 100)}% a ${Math.round(con * 100)}%.${extra}`,
    });
  }
  return out;
}

function pelear() {
  const { a, b, arena } = state;
  const p = probabilidadConArmas(a, b, arena, state.arma.a, state.arma.b);
  const ganador = p >= 0.5 ? a : b;
  const pg = Math.max(p, 1 - p);
  const pctA = Math.round(p * 100);
  const lista = [...razonesArmas(), ...razones(a, b, arena)]
    .map((r) => {
      const cls = r.favorece === a.id ? "fav-a" : r.favorece === b.id ? "fav-b" : "fav-n";
      return `<li class="${cls}">${r.texto}</li>`;
    })
    .join("");

  const res = $("#result");
  res.innerHTML = `
    <div id="fight" class="fight"></div>
    <div id="analysis" class="analysis" hidden>
    <div class="verdict">
      <p class="tag">Según los datos · ${veredicto(p)}</p>
      <div class="winner"><span class="big-emoji cat-${ganador.categoria}">${ganador.emoji}</span>
        <div><small>El favorito</small><h3>${ganador.nombre}</h3>
        <p>Ganaría <b>${Math.round(pg * 100)} de cada 100</b> peleas en ${ARENAS[arena].nombre.toLowerCase()}.</p></div>
      </div>
      <div class="prob">
        <span>${a.emoji} ${pctA}%</span>
        <div class="prob-bar"><i class="pa" style="width:${pctA}%"></i><i class="pb" style="width:${100 - pctA}%"></i></div>
        <span>${100 - pctA}% ${b.emoji}</span>
      </div>
    </div>
    <div class="reasons">
      <h4>Claves del combate</h4>
      <ul>${lista}</ul>
    </div>
    <div class="vote">
      <h4>¿Y tú qué opinas?</h4>
      <div class="vote-btns">
        <button class="btn vote-a" data-v="${a.id}">${a.emoji} ${a.nombre}</button>
        <button class="btn vote-b" data-v="${b.id}">${b.emoji} ${b.nombre}</button>
      </div>
      <p id="vote-res" class="muted"></p>
      <button id="btn-share" class="btn ghost small">Copiar para el grupo</button>
    </div>
    </div>`;
  res.hidden = false;
  $("#compare").hidden = true;

  res.querySelectorAll("[data-v]").forEach((btn) => (btn.onclick = () => votar(btn.dataset.v)));
  $("#btn-share").onclick = () => compartir(ganador, pg);
  renderVotos();
  res.scrollIntoView({ behavior: "smooth", block: "start" });
  correrAnimacion();
}

async function correrAnimacion() {
  const { a, b, arena } = state;
  let r;
  try {
    r = await animarPelea($("#fight"), a, b, arena, { ...state.arma });
  } catch (e) {
    // Si la animación falla, igual mostramos el análisis.
    console.error(e);
    pelea.actual = null;
    r = { ganador: null, sorpresa: false, btns: $("#fight .stage-btns") || $("#fight") };
  }
  if (!r) return;
  ultimaPelea = r.ganador ? r : null;
  const rev = document.createElement("button");
  rev.className = "btn primary small";
  rev.textContent = "Revancha";
  rev.onclick = () => correrAnimacion();
  r.btns.appendChild(rev);
  const analisis = $("#analysis");
  if (analisis.hidden) {
    analisis.hidden = false;
    analisis.classList.add("pop");
    renderComparacion();
  }
}

function votar(id) {
  const v = leerVotos();
  const k = claveDuelo();
  v[k] = v[k] || {};
  v[k][id] = (v[k][id] || 0) + 1;
  guardarVotos(v);
  renderVotos();
}

function renderVotos() {
  const v = leerVotos()[claveDuelo()];
  const el = $("#vote-res");
  if (!el) return;
  if (!v) {
    el.textContent = "Vota y pásale el celular a tus amigos.";
    return;
  }
  const va = v[state.a.id] || 0;
  const vb = v[state.b.id] || 0;
  el.textContent = `Votos en este dispositivo: ${state.a.nombre} ${va} — ${vb} ${state.b.nombre}`;
}

function compartir(ganador, pg) {
  const { a, b, arena } = state;
  const resultado = ultimaPelea
    ? `En nuestra pelea ganó ${ultimaPelea.ganador.nombre}${ultimaPelea.sorpresa ? " (¡SORPRESA!)" : ""}. `
    : "";
  const texto = `🥊 ¿Quién ganaría? ${a.emoji} ${a.nombre} vs ${b.emoji} ${b.nombre} en ${ARENAS[arena].nombre}\n` +
    `${resultado}Según los datos: gana ${ganador.nombre} (${Math.round(pg * 100)}%). ¿Tú qué dices?\n${location.href}`;
  const ok = () => ($("#btn-share").textContent = "¡Copiado!");
  if (navigator.clipboard) navigator.clipboard.writeText(texto).then(ok, () => prompt("Copia esto:", texto));
  else prompt("Copia esto:", texto);
}

function renderComparacion() {
  const { a, b } = state;
  const filaDato = (label, va, vb, unidad) => {
    const ga = va != null && (vb == null || va > vb);
    const gb = vb != null && (va == null || vb > va);
    const f = (v) => (v == null ? "—" : typeof unidad === "function" ? unidad(v) : fmt(v) + unidad);
    return `<tr><td class="${ga ? "win" : ""}">${f(va)}</td><th>${label}</th><td class="${gb ? "win" : ""}">${f(vb)}</td></tr>`;
  };
  const filaAttr = ([k, label]) => `
    <tr><td><div class="bar rev"><i style="width:${a[k]}%"></i></div></td>
    <th>${label}<br><small>${a[k]} · ${b[k]}</small></th>
    <td><div class="bar"><i style="width:${b[k]}%"></i></div></td></tr>`;
  const el = $("#compare");
  el.innerHTML = `
    <h2>Cara a cara</h2>
    <table>
      <thead><tr><th class="ta">${a.emoji} ${a.nombre}</th><th></th><th class="tb">${b.emoji} ${b.nombre}</th></tr></thead>
      <tbody>
        ${filaDato("Peso", a.peso, b.peso, fmtPeso)}
        ${filaDato("Tamaño", a.largo, b.largo, " m")}
        ${filaDato("Velocidad", a.velocidad, b.velocidad, " km/h")}
        ${filaDato("Mordida", a.mordida, b.mordida, " PSI")}
        ${ATRIBUTOS.map(filaAttr).join("")}
      </tbody>
    </table>
    <div class="armas">
      <p><b>${a.emoji} Armas:</b> ${a.armas}</p>
      <p><b>${b.emoji} Armas:</b> ${b.armas}</p>
    </div>
    <p class="muted small">* Fuerza relativa a su tamaño. El peso se cuenta aparte.</p>`;
  el.hidden = false;
}

function aleatorio() {
  const pick = () => LUCHADORES[Math.floor(Math.random() * LUCHADORES.length)];
  state.a = pick();
  do state.b = pick(); while (state.b.id === state.a.id);
  const arenas = Object.keys(ARENAS);
  // Evita arenas absurdas (tiburón en la sabana) la mayoría de las veces
  const buenas = arenas.filter((k) => adaptacion(state.a, k) > 0.3 && adaptacion(state.b, k) > 0.3);
  state.arena = (buenas.length ? buenas : arenas)[Math.floor(Math.random() * (buenas.length || arenas.length))];
  const armas = Object.keys(ARMAS);
  for (const side of ["a", "b"]) {
    state.arma[side] = Math.random() < 0.35 ? armas[Math.floor(Math.random() * armas.length)] : null;
  }
  renderArenas();
  renderSlots();
  pelear();
}

/* ───── enciclopedia ───── */
function renderRoster() {
  chips($("#roster-filters"), itemsCategorias(), state.rosterCat, (k) => {
    state.rosterCat = k;
    renderRoster();
  });
  const cont = $("#roster");
  cont.innerHTML = LUCHADORES.filter((f) => state.rosterCat === "todos" || f.categoria === state.rosterCat)
    .map(
      (f) => `
      <article class="card">
        <header><span class="big-emoji cat-${f.categoria}">${f.emoji}</span><div><h3>${f.nombre}</h3>
          <small>${CATEGORIAS[f.categoria].nombre}${f.enjambre ? " · " + f.cantidad : ""}</small></div></header>
        ${datosReales(f)}
        <div class="bars">${barras(f)}</div>
        <dl class="ficha">
          <dt>Armas</dt><dd>${f.armas}</dd>
          <dt>Fuerte</dt><dd>${f.fortaleza}</dd>
          <dt>Débil</dt><dd>${f.debilidad}</dd>
          <dt>Con armas</dt><dd>Sabe usarlas el <b>${Math.round(habilidadArmas(f) * 100)}%</b> de las veces</dd>
        </dl>
        <p class="dato">${f.dato}</p>
        <div class="card-actions">
          <button class="btn small vote-a" data-set="a" data-id="${f.id}">Esquina roja</button>
          <button class="btn small vote-b" data-set="b" data-id="${f.id}">Esquina azul</button>
        </div>
      </article>`
    )
    .join("");
  cont.querySelectorAll("[data-set]").forEach(
    (btn) =>
      (btn.onclick = () => {
        const side = btn.dataset.set;
        const otro = side === "a" ? "b" : "a";
        const f = byId[btn.dataset.id];
        if (state[otro].id === f.id) state[otro] = state[side];
        state[side] = f;
        renderSlots();
        ocultarResultado();
        $(".ring").scrollIntoView({ behavior: "smooth" });
      })
  );
}

/* ───── init ───── */
$("#slot-a").onclick = () => abrirPicker("a");
$("#slot-b").onclick = () => abrirPicker("b");
$("#picker-search").oninput = renderPicker;
$("#btn-fight").onclick = pelear;
$("#btn-random").onclick = aleatorio;
$("#picker").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.close();
});

initArmas();
renderArenas();
renderSlots();
renderRoster();
