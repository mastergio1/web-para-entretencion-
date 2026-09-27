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

function decorHTML(arena) {
  const d = {
    sabana: ["🌳", "🌾", "🌾", "☀️"],
    selva: ["🌴", "🌿", "🌴", "🦜"],
    rio: ["🌿", "🪷", "🌿", "🦟"],
    oceano: ["🐚", "🪸", "🐠", "☀️"],
    nieve: ["🏔️", "🌲", "❄️", "❄️"],
  }[arena];
  return d.map((e, i) => `<span class="deco d${i}">${e}</span>`).join("");
}

function montarEscenario(cont, a, b, arena) {
  cont.innerHTML = `
    <div class="stage arena-${arena}">
      <div class="decor">${decorHTML(arena)}</div>
      <div class="hud">
        <div class="hp hp-a"><span>${a.nombre}</span><div class="hp-bar"><i></i></div></div>
        <div class="hud-vs">VS</div>
        <div class="hp hp-b"><span>${b.nombre}</span><div class="hp-bar"><i></i></div></div>
      </div>
      <div class="floor">
        <div class="fighter f-a ${a.medio === "aire" ? "flying" : ""}"><div class="bob">${spriteHTML(a)}</div></div>
        <div class="fighter f-b ${b.medio === "aire" ? "flying" : ""}"><div class="bob">${spriteHTML(b)}</div></div>
      </div>
      ${arena === "oceano" || arena === "rio" ? '<div class="water"></div>' : ""}
      ${arena === "nieve" ? '<div class="snow"></div>' : ""}
      <div class="banner"></div>
    </div>
    <div class="commentary"><span>🎙️</span><p></p></div>
    <div class="stage-btns">
      <button class="btn ghost small btn-skip">⏩ Saltar al final</button>
    </div>`;
  return {
    stage: cont.querySelector(".stage"),
    floor: cont.querySelector(".floor"),
    f: { a: cont.querySelector(".f-a"), b: cont.querySelector(".f-b") },
    hp: { a: cont.querySelector(".hp-a i"), b: cont.querySelector(".hp-b i") },
    banner: cont.querySelector(".banner"),
    texto: cont.querySelector(".commentary p"),
    skipBtn: cont.querySelector(".btn-skip"),
    btns: cont.querySelector(".stage-btns"),
  };
}

function efecto(el, clase, contenido, x, y) {
  const s = document.createElement("span");
  s.className = clase;
  s.textContent = contenido;
  s.style.left = x + "px";
  s.style.top = y + "px";
  el.appendChild(s);
  setTimeout(() => s.remove(), 1200);
}

function reiniciarClase(el, clase) {
  el.classList.remove(clase);
  void el.offsetWidth;
  el.classList.add(clase);
}

/*
 * Corre la animación dentro de `cont`. Devuelve una promesa con el resultado,
 * o null si se canceló porque empezó otra pelea.
 */
async function animarPelea(cont, a, b, arena, p) {
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

  const g = guion(p);
  const L = { a, b };
  const ui = montarEscenario(cont, a, b, arena);
  const vida = { a: 100, b: 100 };
  const decir = (t) => (ui.texto.innerHTML = t);
  ui.skipBtn.onclick = ctrl.saltar;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ctrl.saltar();

  // Presentación
  decir(`Esquina roja: <b>${a.nombre}</b> (${a.enjambre ? a.cantidad : fmtPeso(a.peso)}). Esquina azul: <b>${b.nombre}</b> (${b.enjambre ? b.cantidad : fmtPeso(b.peso)}).`);
  ui.banner.textContent = "¿LISTOS?";
  reiniciarClase(ui.banner, "show");
  await esperar(1500);
  ui.banner.textContent = "¡PELEEN!";
  reiniciarClase(ui.banner, "show");
  await esperar(900);

  const fueraDeLugar = [a, b].filter((x) => adaptacion(x, arena) < 0.1);
  if (fueraDeLugar.length) {
    decir(`😬 ${fueraDeLugar.map((x) => x.nombre).join(" y ")} claramente no ${fueraDeLugar.length > 1 ? "deberían" : "debería"} estar en ${ARENAS[arena].nombre.toLowerCase()}…`);
    await esperar(1600);
  }

  for (let i = 0; i < g.turnos.length && !ctrl.skip; i++) {
    const t = g.turnos[i];
    const atk = t.quien;
    const def = atk === "a" ? "b" : "a";
    const golpe = elegir(GOLPES[L[atk].id] || GOLPES_CATEGORIA[L[atk].categoria]);
    const critico = t.dano >= 35;
    const ultimo = i === g.turnos.length - 1;

    decir(
      (ultimo ? "🔥 " : critico ? "💢 ¡GOLPE CRÍTICO! " : "") +
        elegir([
          `¡<b>${L[atk].nombre}</b> lanza ${golpe[0]}!`,
          `¡Uff! <b>${L[atk].nombre}</b> conecta ${golpe[0]}.`,
          `¡${golpe[0].charAt(0).toUpperCase() + golpe[0].slice(1)} de <b>${L[atk].nombre}</b>!`,
          `<b>${L[atk].nombre}</b> responde con ${golpe[0]}.`,
        ])
    );

    const ancho = ui.floor.clientWidth;
    const dx = (atk === "a" ? 1 : -1) * ancho * 0.28;
    ui.f[atk].animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(${-dx * 0.08}px)`, offset: 0.2 },
        { transform: `translateX(${dx}px) scale(1.12)`, offset: 0.5 },
        { transform: "translateX(0)" },
      ],
      { duration: 700, easing: "ease-in-out" }
    );
    await esperar(350);
    if (ctrl.skip) break;

    // Impacto
    vida[def] = Math.max(0, vida[def] - t.dano);
    ui.hp[def].style.width = vida[def] + "%";
    ui.hp[def].classList.toggle("low", vida[def] < 30);
    const r = ui.f[def].getBoundingClientRect();
    const rs = ui.stage.getBoundingClientRect();
    const cx = r.left - rs.left + r.width / 2;
    const cy = r.top - rs.top + r.height * 0.35;
    efecto(ui.stage, "fx" + (critico ? " big" : ""), golpe[1], cx + rand(-20, 20), cy + rand(-15, 15));
    efecto(ui.stage, "dmg", "-" + t.dano, cx + rand(-10, 10), cy - 30);
    reiniciarClase(ui.f[def], "hit");
    if (critico || ultimo) reiniciarClase(ui.stage, "shake");

    await esperar(ultimo ? 700 : 1050);

    if (!ultimo && Math.random() < 0.22) {
      decir(elegir([...EVENTOS.general, ...(EVENTOS[arena] || [])]));
      await esperar(1700);
    }
  }

  if (ctrl.cancelado) return null;

  // Estado final (también si se saltó)
  const W = g.ganador;
  const P = g.perdedor;
  vida[P] = 0;
  vida[W] = Math.max(vida[W], 1);
  ui.hp.a.style.width = vida.a + "%";
  ui.hp.b.style.width = vida.b + "%";
  ui.hp[P].classList.add("low");
  ui.f[P].classList.add("ko");
  ui.f[W].classList.add("win");
  ui.banner.textContent = "K.O.!";
  reiniciarClase(ui.banner, "show");
  ui.banner.classList.add("stay");
  for (let i = 0; i < 18; i++) {
    efecto(ui.stage, "confeti", elegir(["🎉", "✨", "🎊", "⭐"]), rand(0, ui.stage.clientWidth), rand(-10, 40));
  }
  decir(
    g.sorpresa
      ? `😱 ¡SORPRESA TOTAL! <b>${L[W].nombre}</b> gana contra todo pronóstico (solo tenía ${Math.round(g.pW * 100)}% de probabilidad).`
      : `🏆 ¡<b>${L[W].nombre}</b> gana por K.O.! ${vida[W] > 70 ? "Casi sin despeinarse." : vida[W] < 25 ? "Pero quedó hecho pedazos." : ""}`
  );
  ui.skipBtn.remove();
  pelea.actual = null;
  return { ganador: L[W], sorpresa: g.sorpresa, btns: ui.btns };
}
