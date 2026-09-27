/*
 * Armas rudimentarias.
 *
 * Cualquier luchador puede recibir un arma… pero ¿sabrá usarla?
 *   ataque / defensa: bonus si logra usarla
 *   dificultad:       multiplica la probabilidad de saber usarla (arco = difícil)
 *   golpe:            cómo se narra un ataque con el arma
 */
const ARMAS = {
  palo: { nombre: "Palo", articulo: "el palo", lo: "lo", emoji: "🪵", ataque: 10, defensa: 0, dificultad: 1, golpe: "un palazo" },
  piedra: { nombre: "Piedra", articulo: "la piedra", lo: "la", emoji: "🪨", ataque: 12, defensa: 0, dificultad: 1, golpe: "un piedrazo" },
  lanza: { nombre: "Lanza", articulo: "la lanza", lo: "la", emoji: "🔱", ataque: 22, defensa: 5, dificultad: 0.8, golpe: "un lanzazo" },
  machete: { nombre: "Machete", articulo: "el machete", lo: "lo", emoji: "🔪", ataque: 25, defensa: 0, dificultad: 0.9, golpe: "un machetazo" },
  hacha: { nombre: "Hacha", articulo: "el hacha", lo: "la", emoji: "🪓", ataque: 25, defensa: 0, dificultad: 0.9, golpe: "un hachazo" },
  bate: { nombre: "Bate", articulo: "el bate", lo: "lo", emoji: "🏏", ataque: 18, defensa: 0, dificultad: 1, golpe: "un batazo" },
  sarten: { nombre: "Sartén", articulo: "la sartén", lo: "la", emoji: "🍳", ataque: 12, defensa: 8, dificultad: 1, golpe: "un sartenazo" },
  silla: { nombre: "Silla plegable", articulo: "la silla plegable", lo: "la", emoji: "🪑", ataque: 15, defensa: 5, dificultad: 1, golpe: "un sillazo estilo lucha libre" },
  escudo: { nombre: "Escudo de madera", articulo: "el escudo", lo: "lo", emoji: "🛡️", ataque: 3, defensa: 25, dificultad: 1, golpe: "un escudazo" },
  arco: { nombre: "Arco y flechas", articulo: "el arco", lo: "lo", emoji: "🏹", ataque: 22, defensa: 0, dificultad: 0.6, golpe: "un flechazo" },
  boomerang: { nombre: "Boomerang", articulo: "el boomerang", lo: "lo", emoji: "🪃", ataque: 10, defensa: 0, dificultad: 0.6, golpe: "un boomerang (que sí volvió)" },
  chancla: { nombre: "Chancla", articulo: "la chancla", lo: "la", emoji: "🩴", ataque: 5, defensa: 0, dificultad: 1, golpe: "un chanclazo" },
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
  return Math.min(1, habilidadArmas(f) * ARMAS[armaId].dificultad);
}

/* Copia del luchador con el arma en la mano. */
function conArma(f, armaId) {
  if (!armaId) return f;
  const w = ARMAS[armaId];
  let ataque = f.ataque + w.ataque;
  if (armaId === "chancla" && f.id === "latino") ataque += 30; // chancla en manos expertas
  return { ...f, ataque, defensa: f.defensa + w.defensa };
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
      if (w > 0) p += w * probabilidad(usaA ? conArma(a, armaA) : a, usaB ? conArma(b, armaB) : b, arena);
    }
  }
  return p;
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
  const humano = f.categoria === "humano" || f.categoria === "paises";
  let tipo;
  if (humano) tipo = usa ? "exitoHumano" : "falloHumano";
  else if (f.enjambre) tipo = usa ? "exitoEnjambre" : "falloEnjambre";
  else if (usa) tipo = "exitoAnimal";
  else if (f.medio === "agua") tipo = "falloAgua";
  else if (f.categoria === "bichos") tipo = "falloBicho";
  else tipo = "falloAnimal";
  const lista = FRASES_ARMA[tipo];
  return lista[Math.floor(Math.random() * lista.length)]
    .replaceAll("{n}", `<b>${f.nombre}</b>`)
    .replaceAll("{a}", w.articulo)
    .replaceAll("{arma}", w.nombre.toLowerCase())
    .replaceAll("{lo}", w.lo)
    .replace(/^(\S+ )(\p{Ll})/u, (_, emoji, letra) => emoji + letra.toUpperCase());
}
