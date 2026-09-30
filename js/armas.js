/*
 * Armas rudimentarias.
 *
 * Cualquier luchador puede recibir un arma… pero ¿sabrá usarla?
 *   poder:            multiplicador de poder de combate si logra usarla (x2 = mucho más peligroso)
 *   ataque / defensa: bonus a los atributos si logra usarla
 *   dificultad:       multiplica la probabilidad de saber usarla (arco = difícil)
 *   golpe:            cómo se narra un ataque con el arma
 */
const ARMAS = {
  palo: { nombre: "Palo", articulo: "el palo", lo: "lo", poder: 1.3, emoji: "🪵", ataque: 10, defensa: 0, dificultad: 1, golpe: "un palazo" },
  piedra: { nombre: "Piedra", articulo: "la piedra", lo: "la", poder: 1.35, emoji: "🪨", ataque: 12, defensa: 0, dificultad: 1, golpe: "un piedrazo" },
  lanza: { nombre: "Lanza", articulo: "la lanza", lo: "la", poder: 1.9, emoji: "🔱", ataque: 22, defensa: 5, dificultad: 0.8, golpe: "un lanzazo" },
  machete: { nombre: "Machete", articulo: "el machete", lo: "lo", poder: 2.0, emoji: "🔪", ataque: 25, defensa: 0, dificultad: 0.9, golpe: "un machetazo" },
  hacha: { nombre: "Hacha", articulo: "el hacha", lo: "la", poder: 2.0, emoji: "🪓", ataque: 25, defensa: 0, dificultad: 0.9, golpe: "un hachazo" },
  bate: { nombre: "Bate", articulo: "el bate", lo: "lo", poder: 1.55, emoji: "🏏", ataque: 18, defensa: 0, dificultad: 1, golpe: "un batazo" },
  sarten: { nombre: "Sartén", articulo: "la sartén", lo: "la", poder: 1.4, emoji: "🍳", ataque: 12, defensa: 8, dificultad: 1, golpe: "un sartenazo" },
  silla: { nombre: "Silla plegable", articulo: "la silla plegable", lo: "la", poder: 1.5, emoji: "🪑", ataque: 15, defensa: 5, dificultad: 1, golpe: "un sillazo estilo lucha libre" },
  escudo: { nombre: "Escudo de madera", articulo: "el escudo", lo: "lo", poder: 1.45, emoji: "🛡️", ataque: 3, defensa: 25, dificultad: 1, golpe: "un escudazo" },
  arco: { nombre: "Arco y flechas", articulo: "el arco", lo: "lo", poder: 1.9, emoji: "🏹", ataque: 22, defensa: 0, dificultad: 0.6, golpe: "un flechazo" },
  boomerang: { nombre: "Boomerang", articulo: "el boomerang", lo: "lo", poder: 1.35, emoji: "🪃", ataque: 10, defensa: 0, dificultad: 0.6, golpe: "un boomerang (que sí volvió)" },
  chancla: { nombre: "Chancla", articulo: "la chancla", lo: "la", poder: 1.15, emoji: "🩴", ataque: 5, defensa: 0, dificultad: 1, golpe: "un chanclazo" },

  // ───── LEGENDARIAS ─────
  // El arma elige a su portador: `uso` es la misma probabilidad para cualquiera (humano, tiburón u hormiga).
  // Si lo acepta, gana el `victoria` de las veces contra quien sea. Entre dos legendarias decide el `poder`.
  nokia: {
    nombre: "Nokia 3310 indestructible", articulo: "el Nokia 3310", lo: "lo", emoji: "📱", legendaria: true, uso: 0.07, victoria: 0.9, poder: 150,
    ataque: 40, defensa: 40, golpe: "un Nokiazo indestructible", onomatopeya: "¡RING RING!",
    exito: "Suena el tono clásico de Nokia. El 3310 vibra, brilla… y elige a {n}. Tiene 100% de batería desde 2000.",
    fallo: "El Nokia 3310 no considera digno a {n}. Se queda en el suelo, intacto, con 3 barras de señal.",
  },
  chancla_abuela: {
    nombre: "Chancla de la abuela", articulo: "la chancla de la abuela", lo: "la", emoji: "🩴", legendaria: true, uso: 0.08, victoria: 0.88, poder: 120,
    ataque: 40, defensa: 10, golpe: "un chanclazo teledirigido de la abuela", onomatopeya: "¡FLAP!",
    exito: "Se escucha a lo lejos: '¡¿Qué te dije?!'. La chancla de la abuela elige a {n}. Nunca ha fallado un tiro.",
    fallo: "La chancla de la abuela mira a {n} con decepción y regresa volando a su dueña.",
  },
  pan_duro: {
    nombre: "Pan de hace 3 días", articulo: "el pan de hace 3 días", lo: "lo", emoji: "🥖", legendaria: true, uso: 0.09, victoria: 0.85, poder: 100,
    ataque: 40, defensa: 20, golpe: "un panazo con dureza de diamante", onomatopeya: "¡CRONCH!",
    exito: "{n} levanta el pan de hace 3 días. Los geólogos confirman: ya es más duro que el diamante.",
    fallo: "{n} intenta levantar el pan de hace 3 días. No se mueve. Ahora es parte del paisaje.",
  },
  control: {
    nombre: "Control universal", articulo: "el control universal", lo: "lo", emoji: "🎮", legendaria: true, uso: 0.04, victoria: 0.95, poder: 200,
    ataque: 40, defensa: 40, golpe: "un botón de PAUSA seguido de un golpe gratis", onomatopeya: "¡PAUSA!",
    exito: "{n} presiona un botón al azar del control universal… y PAUSA LA REALIDAD. El rival quedó congelado.",
    fallo: "{n} aprieta el control universal y solo logra cambiar el idioma del narrador a portugués. Desculpe.",
  },
  pato: {
    nombre: "Pato de hule cósmico", articulo: "el pato de hule cósmico", lo: "lo", emoji: "🦆", legendaria: true, uso: 0.03, victoria: 0.97, poder: 250,
    ataque: 50, defensa: 50, golpe: "un chillido cósmico de pato de hule", onomatopeya: "¡CUAC!",
    exito: "El pato de hule cósmico abre los ojos. Los planetas se alinean. {n} ahora tiene el poder del universo.",
    fallo: "El pato de hule cósmico hace 'cuac' una vez y se va flotando hacia otra dimensión.",
  },
};

/* Qué tan probable es que cada luchador sepa usar un arma (0-1), con su justificación real (si la hay). */
const HABILIDAD_ARMAS = {
  chimpance: [0.6, "Los chimpancés usan palos y piedras en la vida real. Esto no es tan absurdo."],
  gorila: [0.5, "Se han visto gorilas usando palos para medir la profundidad del agua."],
  pulpo: [0.4, "Los pulpos cargan cáscaras de coco para usarlas de armadura. En serio."],
  elefante: [0.35, "Los elefantes usan ramas con la trompa para espantar moscas."],
  oso_polar: [0.2, "Hay relatos inuit de osos polares lanzando bloques de hielo (nunca confirmado)."],
  grizzly: [0.15, "Tiene zarpas enormes… pero ningún pulgar oponible."],
  canguro: [0.2, "Ya boxea: agarrar un palo no parece tan lejano."],
  hormigas_legionarias: [0.15, "Son 20 millones: entre todas quizá puedan cargarla."],
  delfin: [0.1, "Los delfines usan esponjas marinas para protegerse el hocico al buscar comida."],
  aguila_real: [0.15, "Algunas aves rapaces dejan caer piedras y huesos desde el aire."],
  arpia: [0.15, "Algunas aves rapaces dejan caer piedras y huesos desde el aire."],
  kpoper: [0.9, "Maneja el lightstick como un sable láser. Cualquier arma es parecida."],
  latino: [1, "Entrenado desde niño por la mejor: su mamá."],
  cazador: [1, "Vive de esto."],
};

function habilidadArmas(f) {
  if (HABILIDAD_ARMAS[f.id]) return HABILIDAD_ARMAS[f.id][0];
  if (f.categoria === "humano" || f.categoria === "paises") return 0.95;
  if (f.medio === "agua") return 0.03;
  if (f.categoria === "bichos") return f.enjambre ? 0.08 : 0.02;
  if (f.medio === "aire") return 0.1;
  return 0.08;
}

function probUsoArma(f, armaId) {
  if (!armaId) return 0;
  const w = ARMAS[armaId];
  if (w.legendaria) return w.uso;
  return Math.min(1, habilidadArmas(f) * w.dificultad);
}

/* Copia del luchador con el arma en la mano. */
function conArma(f, armaId) {
  if (!armaId) return f;
  const w = ARMAS[armaId];
  let multArma = w.poder;
  if (armaId === "chancla" && f.id === "latino") multArma = 2.2; // chancla en manos expertas
  return { ...f, ataque: f.ataque + w.ataque, defensa: f.defensa + w.defensa, multArma };
}

/* Probabilidad de que gane A sabiendo quién logró usar su arma. */
function probConUso(a, b, arena, armaA, armaB, usaA, usaB) {
  usaA = usaA && !!armaA;
  usaB = usaB && !!armaB;
  const base = probabilidad(usaA ? conArma(a, armaA) : a, usaB ? conArma(b, armaB) : b, arena);
  const legA = usaA && ARMAS[armaA].legendaria;
  const legB = usaB && ARMAS[armaB].legendaria;
  if (legA && !legB) return Math.max(base, ARMAS[armaA].victoria);
  if (legB && !legA) return Math.min(base, 1 - ARMAS[armaB].victoria);
  return base;
}

/*
 * Probabilidad esperada de que gane A considerando armas:
 * promedio de los 4 casos (A la usa o no × B la usa o no).
 */
function probabilidadConArmas(a, b, arena, armaA, armaB) {
  const ua = probUsoArma(a, armaA);
  const ub = probUsoArma(b, armaB);
  let p = 0;
  for (const [usaA, pa] of [[true, ua], [false, 1 - ua]]) {
    for (const [usaB, pb] of [[true, ub], [false, 1 - ub]]) {
      const w = pa * pb;
      if (w > 0) p += w * probConUso(a, b, arena, armaA, armaB, usaA, usaB);
    }
  }
  return p;
}

/* Chances de f de ganar si NO usa su arma vs. si SÍ la usa (promediando lo que haga el rival). */
function impactoArma(f, rival, arena, armaId, armaRival, esA) {
  const ur = probUsoArma(rival, armaRival);
  const calc = (usaF) => {
    let p = 0;
    for (const [usaR, pr] of [[true, ur], [false, 1 - ur]]) {
      if (pr <= 0) continue;
      p += pr * (esA
        ? probConUso(f, rival, arena, armaId, armaRival, usaF, usaR)
        : 1 - probConUso(rival, f, arena, armaRival, armaId, usaR, usaF));
    }
    return p;
  };
  return [calc(false), calc(true)];
}

/* ───── narración ───── */
const FRASES_ARMA = {
  exitoAnimal: [
    "🤯 ¡NO PUEDE SER! {n} aprendió a usar {a}. La evolución acaba de saltarse un millón de años.",
    "📺 {n} vio un tutorial en YouTube y ahora domina {a}.",
    "🧠 Tras 3 segundos de profunda reflexión, {n} entendió el concepto de '{arma}'.",
    "🎓 {n} sacó un diplomado express en {arma}. El público no lo puede creer.",
    "✨ {n} agarra {a} como si lo hubiera hecho toda la vida. Darwin se revuelca en su tumba.",
    "📜 Una antigua profecía decía que algún día {n} empuñaría {a}. Ese día es hoy.",
    "🔬 Científicos de todo el mundo toman nota: {n} está usando {a}.",
  ],
  falloAnimal: [
    "🤷 {n} olfatea {a}… y {lo} ignora por completo.",
    "😴 {n} usa {a} como almohada.",
    "🍽️ {n} intenta comerse {a}. No sabe bien.",
    "🙈 {n} mira {a}, mira al público, y {lo} tira lejos.",
    "🦴 {n} entierra {a} para más tarde.",
    "🤔 {n} le gruñe a {a} como si fuera el verdadero rival.",
    "💤 {n} se sienta encima de {a} y se niega a moverse.",
  ],
  falloAgua: [
    "🌊 {a} se hunde lentamente hasta el fondo. {n} ni se dio cuenta.",
    "🫧 {n} intenta agarrar {a}… sin manos. Se va flotando.",
  ],
  falloBicho: [
    "🐜 {n} intenta levantar {a}. Pesa unas 50.000 veces más.",
    "🏠 {n} decide que {a} es su nueva casa.",
  ],
  falloEnjambre: [
    "🐜 {n} se lleva {a} al nido. Ahora es decoración.",
    "🌀 {n} rodea {a}, {lo} inspecciona y concluye que no se come.",
  ],
  exitoEnjambre: [
    "🤯 ¡{n} carga {a} entre miles de bichos, en perfecta coordinación! Esto ya es una película de terror.",
  ],
  exitoHumano: [
    "💪 {n} empuña {a} con confianza.",
    "😎 {n} levanta {a}: ahora sí es una pelea.",
    "🗣️ {n} grita '¡ven acá!' blandiendo {a}.",
  ],
  falloHumano: [
    "🤦 {n} se golpea a sí mismo con {a} intentando lucirse.",
    "📱 {n} deja {a} en el suelo para grabar un TikTok.",
    "😬 {n} agarra {a} al revés. Mejor {lo} suelta.",
  ],
};

function fraseArma(f, armaId, usa) {
  const w = ARMAS[armaId];
  if (w.legendaria) return (usa ? w.exito : w.fallo).replaceAll("{n}", `<b>${f.nombre}</b>`);
  const humano = f.categoria === "humano" || f.categoria === "paises";
  let tipo;
  if (humano) tipo = usa ? "exitoHumano" : "falloHumano";
  else if (f.enjambre) tipo = usa ? "exitoEnjambre" : "falloEnjambre";
  else if (usa) tipo = "exitoAnimal";
  else if (f.medio === "agua") tipo = "falloAgua";
  else if (f.categoria === "bichos") tipo = "falloBicho";
  else tipo = "falloAnimal";
  const lista = FRASES_ARMA[tipo];
  return lista[Math.floor(azar() * lista.length)]
    .replaceAll("{n}", `<b>${f.nombre}</b>`)
    .replaceAll("{a}", w.articulo)
    .replaceAll("{arma}", w.nombre.toLowerCase())
    .replaceAll("{lo}", w.lo)
    .replace(/^(\S+ )(\p{Ll})/u, (_, emoji, letra) => emoji + letra.toUpperCase());
}
