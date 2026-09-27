/*
 * Votos: "¿y tú qué opinas?".
 *
 * Si la página corre dentro de Claude (artifact con la capacidad `db`), los votos
 * son compartidos entre todos: cada persona guarda sus votos en `votos/<su id>`
 * y la página suma los de todos. En cualquier otro lugar (GitHub Pages, archivo
 * local) los votos se guardan solo en este dispositivo.
 *
 * Un duelo se identifica por los dos luchadores + el terreno: "gorila|tigre@selva".
 */
const Votos = (() => {
  const CLAVE_LOCAL = "qg-votos";
  let modo = "local"; // "local" | "global"
  let db = null;
  let miId = null;
  let misVotos = {}; // { duelo: idLuchador } (modo global)
  let totales = {}; // { duelo: { idLuchador: n } }
  const oyentes = [];

  function leerLocal() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_LOCAL) || "{}");
    } catch {
      return {};
    }
  }
  function guardarLocal(v) {
    try {
      localStorage.setItem(CLAVE_LOCAL, JSON.stringify(v));
    } catch {}
  }
  function avisar() {
    oyentes.forEach((fn) => fn());
  }

  totales = leerLocal();

  async function init() {
    if (!window.claude || typeof window.claude.use !== "function") return;
    try {
      const [dbNs, userNs] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!dbNs || !userNs) return;
      const id = await userNs.id();
      db = dbNs;
      miId = id;
      modo = "global";
      totales = {};
      avisar();
      db.collection("votos")
        .limit(1000)
        .onSnapshot(
          (snap) => {
            const t = {};
            for (const d of snap.docs) {
              const v = (d.data() || {}).v || {};
              for (const [duelo, luchador] of Object.entries(v)) {
                if (typeof luchador !== "string") continue;
                t[duelo] = t[duelo] || {};
                t[duelo][luchador] = (t[duelo][luchador] || 0) + 1;
              }
              if (d.id === miId) misVotos = { ...v };
            }
            totales = t;
            avisar();
          },
          () => {
            modo = "local";
            totales = leerLocal();
            avisar();
          }
        );
    } catch {
      modo = "local";
    }
  }

  let escribiendo = Promise.resolve();

  /* Registra un voto. En modo global cada persona tiene UN voto por duelo (puede cambiarlo). */
  function votar(duelo, luchadorId) {
    if (modo === "global" && miId) {
      misVotos = { ...misVotos, [duelo]: luchadorId };
      const cuerpo = { v: { ...misVotos } };
      escribiendo = escribiendo
        .then(() => db.doc("votos/" + miId).set(cuerpo))
        .catch(() => {
          // Sin permiso para escribir: seguimos en local
          modo = "local";
          const v = leerLocal();
          v[duelo] = v[duelo] || {};
          v[duelo][luchadorId] = (v[duelo][luchadorId] || 0) + 1;
          guardarLocal(v);
          totales = v;
          avisar();
        });
      return;
    }
    const v = leerLocal();
    v[duelo] = v[duelo] || {};
    v[duelo][luchadorId] = (v[duelo][luchadorId] || 0) + 1;
    guardarLocal(v);
    totales = v;
    avisar();
  }

  function conteo(duelo) {
    return totales[duelo] || {};
  }

  function miVoto(duelo) {
    return modo === "global" ? misVotos[duelo] || null : null;
  }

  /* Duelos con más votos y los más polémicos (más cerca del 50/50). */
  function ranking() {
    const lista = Object.entries(totales)
      .map(([duelo, c]) => {
        const [ids, arena] = duelo.split("@");
        const [x, y] = ids.split("|");
        const vx = c[x] || 0;
        const vy = c[y] || 0;
        const total = vx + vy;
        return { duelo, x, y, arena, vx, vy, total, empate: total ? Math.min(vx, vy) / total : 0 };
      })
      .filter((d) => d.total > 0 && byIdVotos(d.x) && byIdVotos(d.y) && ARENAS[d.arena]);
    const masVotados = [...lista].sort((p, q) => q.total - p.total).slice(0, 5);
    const polemicos = lista
      .filter((d) => d.total >= 2)
      .sort((p, q) => q.empate - p.empate || q.total - p.total)
      .slice(0, 5);
    return { masVotados, polemicos };
  }

  function byIdVotos(id) {
    return LUCHADORES.find((f) => f.id === id);
  }

  return {
    init,
    votar,
    conteo,
    miVoto,
    ranking,
    get modo() {
      return modo;
    },
    onChange: (fn) => oyentes.push(fn),
  };
})();
