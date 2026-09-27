/*
 * Motor de combate.
 *
 * poder = calidad de combate × peso^0.33 × adaptación a la arena
 * P(A gana) = poderA^k / (poderA^k + poderB^k)
 *
 * El peso entra con exponente bajo (0.33) porque el tamaño importa mucho,
 * pero no lo es todo: un león de 190 kg vence a un búfalo de 750 kg a veces.
 */
const PESOS_ATRIBUTOS = {
  ataque: 0.3,
  defensa: 0.15,
  fuerza: 0.15,
  agilidad: 0.12,
  ferocidad: 0.15,
  resistencia: 0.05,
  inteligencia: 0.08,
};
const EXPONENTE_PESO = 0.33;
const K = 3;

function calidad(f) {
  let q = 0;
  for (const [attr, w] of Object.entries(PESOS_ATRIBUTOS)) q += f[attr] * w;
  return q;
}

/* Qué tan cómodo está un luchador en una arena (≈0 a 1.2). */
function adaptacion(f, arena) {
  if (f.arenas && f.arenas[arena] != null) return f.arenas[arena];
  const local = f.hogar.includes(arena) ? 0.12 : 0;
  switch (arena) {
    case "sabana":
    case "selva":
      if (f.medio === "agua") return 0.02;
      if (f.medio === "anfibio") return 0.85 + local;
      if (f.medio === "aire" && arena === "selva") return 0.9 + local;
      return 1 + local;
    case "rio":
      if (f.medio === "anfibio") return 1.15 + local;
      if (f.medio === "agua") return 0.85;
      if (f.medio === "aire") return 0.6;
      return 0.45 + 0.5 * f.nado + local;
    case "oceano":
      if (f.medio === "agua") return 1.15 + local;
      if (f.medio === "anfibio") return 0.8 + local;
      if (f.medio === "aire") return 0.35;
      return 0.2 + 0.55 * f.nado + local;
    case "nieve":
      if (f.medio === "agua") return 0.02;
      if (f.frio || f.hogar.includes("nieve")) return 1.05 + local;
      if (f.medio === "anfibio") return 0.45;
      return 0.8;
  }
  return 1;
}

function pesoCombate(f) {
  return f.pesoEfectivo ?? f.peso;
}

/* Ventaja especial de f contra un rival concreto (ej: abejas vs elefante). */
function especial(f, rival) {
  return (f.especiales || []).find((e) => e.vs.includes(rival.id));
}

function poder(f, arena, rival) {
  const esp = rival && especial(f, rival);
  return calidad(f) * Math.pow(pesoCombate(f), EXPONENTE_PESO) * adaptacion(f, arena) * (esp ? esp.mult : 1);
}

function probabilidad(a, b, arena) {
  const pa = Math.pow(poder(a, arena, b), K);
  const pb = Math.pow(poder(b, arena, a), K);
  return pa / (pa + pb);
}

function fmtNum(n) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function fmtPeso(kg) {
  if (kg >= 1) return fmtNum(kg) + " kg";
  if (kg >= 0.001) return fmtNum(kg * 1000) + " g";
  return fmtNum(kg * 1e6) + " mg";
}

/* Razones legibles de por qué gana uno u otro, ordenadas por impacto. */
function razones(a, b, arena) {
  const out = [];
  const add = (impacto, favorece, texto) => out.push({ impacto, favorece, texto });

  // Arena
  const adA = adaptacion(a, arena), adB = adaptacion(b, arena);
  const nombreArena = ARENAS[arena].nombre.toLowerCase();
  [[a, adA, b, adB], [b, adB, a, adA]].forEach(([x, ax, y, ay]) => {
    if (ax < 0.1) add(10, y.id, `${x.nombre} prácticamente no puede pelear en ${nombreArena}: está fuera de su elemento.`);
    else if (ax - ay > 0.3) add(6, x.id, `El terreno (${nombreArena}) favorece claramente a ${x.nombre}.`);
    else if (x.hogar.includes(arena) && !y.hogar.includes(arena)) add(2, x.id, `${x.nombre} juega de local en ${nombreArena}.`);
  });

  // Especiales
  [[a, b], [b, a]].forEach(([x, y]) => {
    const e = especial(x, y);
    if (e) add(8, x.id, e.texto);
  });

  // Enjambres
  [a, b].forEach((x) => {
    if (x.enjambre) add(4, x.id, `${x.nombre} son ${x.cantidad}: no se les puede noquear de un golpe.`);
  });

  // Peso (no aplica si hay enjambres: su peso real engaña)
  if (!a.enjambre && !b.enjambre) {
    const [pesado, liviano] = a.peso >= b.peso ? [a, b] : [b, a];
    const ratio = pesado.peso / liviano.peso;
    if (ratio >= 1.4) {
      add(Math.min(9, 2 + Math.log2(ratio) * 1.5), pesado.id,
        `${pesado.nombre} pesa ${ratio >= 10 ? fmtNum(Math.round(ratio)) : fmtNum(ratio)} veces más (${fmtPeso(pesado.peso)} vs ${fmtPeso(liviano.peso)}).`);
    } else {
      add(1, null, `Pesan parecido (${fmtPeso(a.peso)} vs ${fmtPeso(b.peso)}): pelea pareja en tamaño.`);
    }
  }

  // Mordida
  if (a.mordida && b.mordida) {
    const [m, n] = a.mordida >= b.mordida ? [a, b] : [b, a];
    if (m.mordida / n.mordida >= 1.5) add(3, m.id, `La mordida de ${m.nombre} (${fmtNum(m.mordida)} PSI) es ${fmtNum(m.mordida / n.mordida)} veces más fuerte.`);
  } else if (a.mordida || b.mordida) {
    const m = a.mordida ? a : b;
    if (m.mordida >= 900) add(3, m.id, `${m.nombre} tiene una mordida demoledora de ${fmtNum(m.mordida)} PSI.`);
  }

  // Atributos
  const diff = (attr, umbral, imp, frase) => {
    const d = a[attr] - b[attr];
    if (Math.abs(d) >= umbral) {
      const [x, y] = d > 0 ? [a, b] : [b, a];
      add(imp, x.id, frase(x, y));
    }
  };
  diff("ataque", 20, 5, (x, y) => `${x.nombre} tiene armas mucho más letales: ${x.armas.toLowerCase()}.`);
  diff("defensa", 25, 3, (x) => `${x.nombre} aguanta mucho más castigo. ${x.fortaleza}`);
  diff("agilidad", 25, 2.5, (x, y) => `${x.nombre} es bastante más ágil y rápido que ${y.nombre}.`);
  diff("ferocidad", 25, 2, (x) => `${x.nombre} es más agresivo y no se rinde fácil.`);
  diff("inteligencia", 30, 1.5, (x) => `${x.nombre} puede pensar una estrategia (y huir si hace falta).`);
  diff("resistencia", 30, 1.5, (x, y) => `Si la pelea se alarga, ${x.nombre} aguanta más que ${y.nombre}.`);

  // Debilidades del perdedor probable
  const p = probabilidad(a, b, arena);
  const perdedor = p >= 0.5 ? b : a;
  const ganador = p >= 0.5 ? a : b;
  add(1.2, ganador.id, `Punto débil de ${perdedor.nombre}: ${perdedor.debilidad.charAt(0).toLowerCase()}${perdedor.debilidad.slice(1)}`);

  return out.sort((r1, r2) => r2.impacto - r1.impacto).slice(0, 5);
}

function veredicto(p) {
  const x = Math.max(p, 1 - p);
  if (x >= 0.97) return "Paliza total";
  if (x >= 0.85) return "Victoria clara";
  if (x >= 0.7) return "Favorito, pero con riesgo";
  if (x >= 0.58) return "Ligera ventaja";
  return "Moneda al aire";
}

if (typeof module !== "undefined") {
  module.exports = { calidad, adaptacion, poder, probabilidad, razones, veredicto, fmtPeso };
}
