/*
 * Animación de la pelea.
 *
 * El ganador se sortea con la probabilidad del motor: el favorito gana casi siempre,
 * pero de vez en cuando hay sorpresa (como en la vida real).
 */
const pelea = { actual: null };

function rand(min, max) {
  return min + Math.random() * (max - min);
}
function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

/* Reparte `total` en `n` golpes; el último pega más fuerte. */
function repartir(total, n, finalFuerte) {
  if (n <= 0) return [];
  const w = Array.from({ length: n }, (_, i) => rand(0.5, 1.5) * (finalFuerte && i === n - 1 ? 1.8 : 1));
  const s = w.reduce((x, y) => x + y, 0);
  const out = w.map((x) => Math.max(1, Math.round((x / s) * total)));
  const diff = total - out.reduce((x, y) => x + y, 0);
  out[out.length - 1] = Math.max(1, out[out.length - 1] + diff);
  return out;
}

/* Guion completo de la pelea: quién pega, cuánto y cuándo pasan cosas absurdas. */
function guion(p) {
  const ganaA = Math.random() < p;
  const W = ganaA ? "a" : "b";
  const L = ganaA ? "b" : "a";
  const pW = ganaA ? p : 1 - p;
  const hpFinalW =
    pW >= 0.5 ? Math.round(clamp(8 + (pW - 0.5) * 170 * rand(0.6, 1.1), 6, 96)) : Math.round(rand(4, 22));

  const n = 4 + Math.floor(Math.random() * 4);
  const seq = [];
  for (let i = 0; i < n - 1; i++) seq.push(Math.random() < 0.45 + (pW - 0.5) * 0.7 ? W : L);
  if (!seq.includes(L)) seq[Math.floor(Math.random() * seq.length)] = L;
  seq.push(W);

  const danoW = repartir(100, seq.filter((s) => s === W).length, true);
  const danoL = repartir(100 - hpFinalW, seq.filter((s) => s === L).length, false);
  const turnos = seq.map((quien) => ({ quien, dano: quien === W ? danoW.shift() : danoL.shift() }));
  return { ganador: W, perdedor: L, sorpresa: pW < 0.5, pW, turnos };
}

function spriteHTML(f) {
  if (!f.enjambre) return `<div class="sprite">${f.emoji}</div>`;
  const bichos = Array.from(
    { length: 9 },
    (_, i) =>
      `<span style="--x:${rand(-38, 38).toFixed(0)}%;--y:${rand(-38, 38).toFixed(0)}%;--d:${rand(0.3, 0.9).toFixed(2)}s;--r:${rand(-30, 30).toFixed(0)}deg">${f.emoji}</span>`
  ).join("");
  return `<div class="sprite swarm">${bichos}</div>`;
}

function armaHTML(armaId) {
  if (!armaId) return "";
  return `<span class="arma-sprite${ARMAS[armaId].legendaria ? " legendaria" : ""}">${ARMAS[armaId].emoji}</span>`;
}

/* Onomatopeyas de cómic según el tipo de golpe. */
const ONOMATOPEYAS = {
  "🦷": ["¡ÑAM!", "¡CHOMP!", "¡CRUNCH!"],
  "🐾": ["¡ZAS!", "¡SWISH!", "¡RAS!"],
  "🧪": ["¡PIC!", "¡ZZZT!", "¡AUCH!"],
  "🌀": ["¡CRAC!", "¡SQUISH!"],
  "🦶": ["¡PAF!", "¡PLAF!"],
  "👊": ["¡PUM!", "¡POW!"],
  "🥊": ["¡PUM!", "¡POW!"],
  "🗡️": ["¡ZAS!", "¡CHAS!"],
  "🌊": ["¡SPLASH!", "¡GLUB!"],
  "📢": ["¡GRRR!", "¡ROAR!"],
};
const ONOMATOPEYAS_ARMA = ["¡BONK!", "¡CLANK!", "¡TOING!", "¡PLONK!"];
const ONOMATOPEYAS_GENERICAS = ["¡PUM!", "¡PAF!", "¡BAM!", "¡KAPOW!", "¡CRACK!"];

function montarEscenario(cont, a, b, arena, armas) {
  const agua = arena === "oceano" || arena === "rio";
  cont.innerHTML = `
    <div class="stage arena-${arena}">
      <div class="paisaje" aria-hidden="true"><i class="sol"></i><i class="lejos"></i><i class="arbol"></i></div>
      <div class="foco"></div>
      <div class="speed"></div>
      <div class="camara">
        <div class="fighter f-a ${a.medio === "aire" ? "flying" : ""}"><div class="bob">${spriteHTML(a)}${armaHTML(armas.a)}</div></div>
        <div class="fighter f-b ${b.medio === "aire" ? "flying" : ""}"><div class="bob">${spriteHTML(b)}${armaHTML(armas.b)}</div></div>
      </div>
      ${agua ? '<div class="water"></div>' : ""}
      ${arena === "nieve" ? '<div class="snow"></div>' : ""}
      <div class="halftone"></div>
      <div class="flash"></div>
      <div class="hud">
        <div class="hp hp-a"><span>${a.nombre}</span><div class="hp-bar"><u></u><i></i></div></div>
        <div class="hud-vs">VS</div>
        <div class="hp hp-b"><span>${b.nombre}</span><div class="hp-bar"><u></u><i></i></div></div>
      </div>
      <div class="banner"><span></span></div>
    </div>
    <div class="commentary"><span class="envivo">En vivo</span><p></p></div>
    <div class="stage-btns">
      <button class="btn ghost small btn-skip">Saltar al final</button>
    </div>`;
  const q = (sel) => cont.querySelector(sel);
  return {
    stage: q(".stage"),
    camara: q(".camara"),
    speed: q(".speed"),
    flash: q(".flash"),
    foco: q(".foco"),
    f: { a: q(".f-a"), b: q(".f-b") },
    bob: { a: q(".f-a .bob"), b: q(".f-b .bob") },
    hp: { a: q(".hp-a i"), b: q(".hp-b i") },
    trail: { a: q(".hp-a u"), b: q(".hp-b u") },
    arma: { a: q(".f-a .arma-sprite"), b: q(".f-b .arma-sprite") },
    banner: q(".banner"),
    bannerTxt: q(".banner span"),
    texto: q(".commentary p"),
    skipBtn: q(".btn-skip"),
    btns: q(".stage-btns"),
  };
}

function efecto(el, clase, html, x, y, estilos = {}) {
  const s = document.createElement("div");
  s.className = clase;
  s.innerHTML = html;
  s.style.left = x + "px";
  s.style.top = y + "px";
  for (const [k, v] of Object.entries(estilos)) s.style.setProperty(k, v);
  el.appendChild(s);
  setTimeout(() => s.remove(), 1500);
}

function reiniciarClase(el, clase) {
  el.classList.remove(clase);
  void el.offsetWidth;
  el.classList.add(clase);
}

/* Quita el emoji inicial de las frases: el narrador habla, no manda stickers. */
function sinEmojiInicial(t) {
  return t.replace(/^[\p{Extended_Pictographic}️‍]+\s*/u, "");
}

/*
 * Corre la animación dentro de `cont`. Devuelve una promesa con el resultado,
 * o null si se canceló porque empezó otra pelea.
 */
async function animarPelea(cont, a, b, arena, armas) {
  if (pelea.actual) pelea.actual.cancelar();

  const ctrl = { skip: false, cancelado: false, esperas: [] };
  ctrl.saltar = () => {
    ctrl.skip = true;
    ctrl.esperas.splice(0).forEach((fn) => fn());
  };
  ctrl.cancelar = () => {
    ctrl.cancelado = true;
    ctrl.saltar();
  };
  pelea.actual = ctrl;

  const esperar = (ms) =>
    ctrl.skip
      ? Promise.resolve()
      : new Promise((r) => {
          const t = setTimeout(r, ms);
          ctrl.esperas.push(() => {
            clearTimeout(t);
            r();
          });
        });

  // ¿Sabrán usar el arma? Se decide antes, y define la probabilidad real de esta pelea.
  const usa = {
    a: !!armas.a && Math.random() < probUsoArma(a, armas.a),
    b: !!armas.b && Math.random() < probUsoArma(b, armas.b),
  };
  const pReal = probConUso(a, b, arena, armas.a, armas.b, usa.a, usa.b);
  const g = guion(pReal);
  g.sorpresa = g.pW < 0.4;
  const L = { a, b };
  const ui = montarEscenario(cont, a, b, arena, armas);
  const vida = { a: 100, b: 100 };
  const decir = (t) => {
    ui.texto.innerHTML = sinEmojiInicial(t);
    reiniciarClase(ui.texto, "pop");
  };
  const cartel = (t, fijo) => {
    ui.bannerTxt.textContent = t;
    ui.banner.classList.remove("stay");
    reiniciarClase(ui.banner, fijo ? "stay" : "show");
  };
  const ponerVida = (side) => {
    ui.hp[side].style.width = vida[side] + "%";
    ui.trail[side].style.width = vida[side] + "%";
    ui.hp[side].classList.toggle("low", vida[side] < 30);
  };
  ui.skipBtn.onclick = ctrl.saltar;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ctrl.saltar();

  // Presentación
  decir(`Esquina roja: <b>${a.nombre}</b> (${a.enjambre ? a.cantidad : fmtPeso(a.peso)}). Esquina azul: <b>${b.nombre}</b> (${b.enjambre ? b.cantidad : fmtPeso(b.peso)}).`);
  cartel("¿Listos?");
  await esperar(1400);
  cartel("¡Peleen!");
  await esperar(1000);

  const fueraDeLugar = [a, b].filter((x) => adaptacion(x, arena) < 0.1);
  if (fueraDeLugar.length) {
    decir(`😬 ${fueraDeLugar.map((x) => x.nombre).join(" y ")} claramente no ${fueraDeLugar.length > 1 ? "deberían" : "debería"} estar en ${ARENAS[arena].nombre.toLowerCase()}…`);
    await esperar(1600);
  }

  for (const side of ["a", "b"]) {
    if (!armas[side]) continue;
    const w = ARMAS[armas[side]];
    if (w.legendaria) {
      // Entrada especial: el arma cae del cielo en un rayo dorado
      ui.stage.insertAdjacentHTML("beforeend", `<div class="rayo rayo-${side}"></div>`);
      cartel("¡Legendaria!");
      decir(`Del cielo cae un arma legendaria junto a <b>${L[side].nombre}</b>: <b>${w.nombre}</b>. ¿Lo elegirá como su portador?`);
      reiniciarClase(ui.arma[side], "arma-duda");
      await esperar(2400);
      ui.stage.querySelector(".rayo-" + side)?.remove();
      ui.arma[side].classList.remove("arma-duda");
      ui.arma[side].classList.add(usa[side] ? "arma-ok" : "arma-caida");
      if (usa[side]) {
        reiniciarClase(ui.flash, "oro");
        cartel("¡Elegido!");
      }
      decir(fraseArma(L[side], armas[side], usa[side]));
      await esperar(3000);
      continue;
    }
    decir(`${ARMAS[armas[side]].emoji} Alguien le lanza ${ARMAS[armas[side]].articulo} a <b>${L[side].nombre}</b>… ¿sabrá usarl${ARMAS[armas[side]].lo === "la" ? "a" : "o"}?`);
    reiniciarClase(ui.arma[side], "arma-duda");
    await esperar(1600);
    ui.arma[side].classList.remove("arma-duda");
    ui.arma[side].classList.add(usa[side] ? "arma-ok" : "arma-caida");
    decir(fraseArma(L[side], armas[side], usa[side]));
    await esperar(2300);
  }

  for (let i = 0; i < g.turnos.length && !ctrl.skip; i++) {
    const t = g.turnos[i];
    const atk = t.quien;
    const def = atk === "a" ? "b" : "a";
    const conElArma = usa[atk] && Math.random() < (ARMAS[armas[atk]].legendaria ? 0.85 : 0.55);
    const esHumano = L[atk].categoria === "humano" || L[atk].categoria === "paises";
    const golpe = conElArma
      ? [ARMAS[armas[atk]].golpe + (!esHumano && Math.random() < 0.5 ? " (nadie entiende cómo lo sostiene)" : ""), ARMAS[armas[atk]].emoji]
      : elegir(GOLPES[L[atk].id] || GOLPES_CATEGORIA[L[atk].categoria]);
    const critico = t.dano >= 35;
    const ultimo = i === g.turnos.length - 1;

    decir(
      (ultimo ? "<b>¡GOLPE FINAL!</b> " : critico ? "<b>¡CRÍTICO!</b> " : "") +
        elegir([
          `¡<b>${L[atk].nombre}</b> lanza ${golpe[0]}!`,
          `¡Uff! <b>${L[atk].nombre}</b> conecta ${golpe[0]}.`,
          `¡${golpe[0].charAt(0).toUpperCase() + golpe[0].slice(1)} de <b>${L[atk].nombre}</b>!`,
          `<b>${L[atk].nombre}</b> responde con ${golpe[0]}.`,
        ])
    );

    const dir = atk === "a" ? 1 : -1;
    const dx = dir * ui.stage.clientWidth * 0.3;
    // Anticipación (se echa para atrás) → embestida con estiramiento → regreso
    ui.f[atk].animate(
      [
        { transform: "translateX(0) scale(1)" },
        { transform: `translateX(${-dx * 0.12}px) scale(0.88, 1.1)`, offset: 0.28 },
        { transform: `translateX(${dx}px) skewX(${-dir * 14}deg) scale(1.15, 0.9)`, offset: 0.55 },
        { transform: `translateX(${dx * 0.9}px) scale(1)`, offset: 0.72 },
        { transform: "translateX(0) scale(1)" },
      ],
      { duration: 820, easing: "cubic-bezier(.5,0,.3,1)" }
    );
    await esperar(260);
    reiniciarClase(ui.speed, "on");
    await esperar(190);
    if (ctrl.skip) break;

    // Impacto
    vida[def] = Math.max(0, vida[def] - t.dano);
    ponerVida(def);
    reiniciarClase(ui.flash, "on");
    ui.f[def].animate(
      [
        { transform: "translateX(0) rotate(0)" },
        { transform: `translateX(${dir * (critico ? 60 : 32)}px) rotate(${dir * (critico ? 16 : 9)}deg)`, offset: 0.25 },
        { transform: "translateX(0) rotate(0)" },
      ],
      { duration: 520, easing: "cubic-bezier(.2,.8,.3,1)" }
    );
    const r = ui.f[def].getBoundingClientRect();
    const rs = ui.stage.getBoundingClientRect();
    const cx = r.left - rs.left + r.width / 2;
    const cy = r.top - rs.top + r.height * 0.3;
    const palabra = conElArma
      ? ARMAS[armas[atk]].onomatopeya || elegir(ONOMATOPEYAS_ARMA)
      : elegir(ONOMATOPEYAS[golpe[1]] || ONOMATOPEYAS_GENERICAS);
    efecto(ui.stage, "pow" + (critico || ultimo ? " big" : ""), `<b>${palabra}</b>`, cx - dir * 20 + rand(-15, 15), cy + rand(-10, 10), {
      "--rot": rand(-14, 8).toFixed(0) + "deg",
    });
    efecto(ui.stage, "dmg", "-" + t.dano, cx + dir * 70, cy - 45);
    reiniciarClase(ui.f[def], "hit");
    if (critico || ultimo) {
      reiniciarClase(ui.stage, "shake");
      ui.camara.animate(
        [{ transform: "scale(1)" }, { transform: `scale(1.14) translateX(${-dir * 4}%)`, offset: 0.3 }, { transform: "scale(1)" }],
        { duration: 700, easing: "ease-out" }
      );
    }

    await esperar(ultimo ? 700 : 1100);

    if (!ultimo && Math.random() < 0.22) {
      decir(elegir([...EVENTOS.general, ...(EVENTOS[arena] || [])]));
      await esperar(1700);
    }
  }

  if (ctrl.cancelado) return null;

  // Si se saltó, igual mostramos qué pasó con las armas
  for (const side of ["a", "b"]) {
    if (armas[side]) {
      ui.arma[side].classList.remove("arma-duda");
      ui.arma[side].classList.add(usa[side] ? "arma-ok" : "arma-caida");
    }
  }

  ui.stage.querySelectorAll(".rayo").forEach((r) => r.remove());

  // Estado final (también si se saltó)
  const W = g.ganador;
  const P = g.perdedor;
  vida[P] = 0;
  vida[W] = Math.max(vida[W], 1);
  ponerVida("a");
  ponerVida("b");
  ui.f[P].classList.add("ko");
  ui.bob[P].insertAdjacentHTML("beforeend", '<div class="estrellas"><b>★</b><b>★</b><b>★</b></div>');
  ui.f[W].classList.add("win");
  ui.foco.style.background = `radial-gradient(circle at ${W === "a" ? "22%" : "78%"} 60%, rgba(255,255,255,.35), transparent 32%), rgba(0,0,0,.25)`;
  ui.foco.classList.add("on");
  const ganoConLegendaria = usa[W] && armas[W] && ARMAS[armas[W]].legendaria;
  cartel(ganoConLegendaria ? "¡Legendario!" : g.sorpresa ? "¡Sorpresa!" : "¡K.O.!", true);
  const colores = ["#ffc23d", "#ff4b3a", "#3b8cff", "#45d483", "#fff"];
  for (let i = 0; i < 28; i++) {
    efecto(ui.stage, "confeti", "", rand(0, ui.stage.clientWidth), rand(-20, 30), {
      "--c": elegir(colores),
      "--dx": rand(-60, 60).toFixed(0) + "px",
      "animation-delay": rand(0, 0.4).toFixed(2) + "s",
    });
  }
  decir(
    ganoConLegendaria
      ? `¡VICTORIA LEGENDARIA! <b>${L[W].nombre}</b> gana gracias ${ARMAS[armas[W]].articulo.startsWith("el ") ? "al " + ARMAS[armas[W]].articulo.slice(3) : "a " + ARMAS[armas[W]].articulo}. Esto se va a contar por generaciones.`
      : (g.sorpresa
      ? `¡SORPRESA TOTAL! <b>${L[W].nombre}</b> gana contra todo pronóstico (en esta pelea solo tenía ${Math.round(g.pW * 100)}% de probabilidad).`
      : `¡<b>${L[W].nombre}</b> gana por K.O.! ${vida[W] > 70 ? "Casi sin despeinarse." : vida[W] < 25 ? "Pero quedó hecho pedazos." : ""}`) +
      (usa[W] && armas[W] ? ` Gracias en parte ${ARMAS[armas[W]].articulo.startsWith("el ") ? "al " + ARMAS[armas[W]].articulo.slice(3) : "a " + ARMAS[armas[W]].articulo}.` : "") +
      (armas[P] && !usa[P] ? ` Quizás le habría ido mejor si hubiera sabido usar ${ARMAS[armas[P]].articulo}.` : "")
  );
  ui.skipBtn.remove();
  pelea.actual = null;
  return { ganador: L[W], sorpresa: g.sorpresa, btns: ui.btns };
}
