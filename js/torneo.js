/*
 * Torneo de la noche: 8 luchadores al azar, eliminación directa.
 * Cuartos (4 peleas) → Semifinal (2) → Final (1). Cada pelea tiene su propio terreno.
 */
const Torneo = (() => {
  const RONDAS = ["Cuartos", "Semifinal", "Final"];
  let rondas = []; // [[{a, b, arena, ganador}]]
  let peleando = false;

  function terrenoPara(a, b) {
    const todas = Object.keys(ARENAS);
    const buenas = todas.filter((k) => adaptacion(a, k) > 0.3 && adaptacion(b, k) > 0.3);
    const lista = buenas.length ? buenas : todas;
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function sortear() {
    const pool = [...LUCHADORES];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const ocho = pool.slice(0, 8);
    rondas = [
      [0, 1, 2, 3].map((i) => {
        const a = ocho[i * 2];
        const b = ocho[i * 2 + 1];
        return { a, b, arena: terrenoPara(a, b), ganador: null };
      }),
      [0, 1].map(() => ({ a: null, b: null, arena: null, ganador: null })),
      [{ a: null, b: null, arena: null, ganador: null }],
    ];
    document.querySelector("#torneo-pelea").innerHTML = "";
    render();
  }

  function siguiente() {
    for (let r = 0; r < rondas.length; r++) {
      for (let m = 0; m < rondas[r].length; m++) {
        const p = rondas[r][m];
        if (!p.ganador && p.a && p.b) return { r, m, p };
      }
    }
    return null;
  }

  function campeon() {
    const f = rondas[2] && rondas[2][0];
    return f && f.ganador ? f[f.ganador] : null;
  }

  function avanzar(r, m, lado) {
    const p = rondas[r][m];
    p.ganador = lado;
    if (r + 1 < rondas.length) {
      const sig = rondas[r + 1][Math.floor(m / 2)];
      sig[m % 2 === 0 ? "a" : "b"] = p[lado];
      if (sig.a && sig.b) sig.arena = terrenoPara(sig.a, sig.b);
    }
  }

  async function pelearSiguiente() {
    const s = siguiente();
    if (!s || peleando) return;
    peleando = true;
    render();
    const cont = document.querySelector("#torneo-pelea");
    cont.scrollIntoView({ behavior: "smooth", block: "center" });
    const r = await jugarPelea(cont, s.p.a, s.p.b, s.p.arena, { a: null, b: null });
    peleando = false;
    if (!r || !r.ganador) {
      render();
      return;
    }
    avanzar(s.r, s.m, r.ganador.id === s.p.a.id ? "a" : "b");
    render();
    const c = campeon();
    if (c) {
      cont.querySelector(".commentary p").innerHTML = `¡<b>${c.nombre}</b> es el campeón del torneo de la noche!`;
    }
  }

  function simularResto() {
    if (peleando) return;
    let s;
    while ((s = siguiente())) {
      const p = probabilidad(s.p.a, s.p.b, s.p.arena);
      avanzar(s.r, s.m, Math.random() < p ? "a" : "b");
    }
    render();
  }

  function filaLuchador(f, estado) {
    if (!f) return `<div class="bk-fila vacia"><span class="bk-emoji"></span><span>Por definir</span></div>`;
    return `<div class="bk-fila ${estado}"><span class="bk-emoji">${f.emoji}</span><span>${f.nombre}</span></div>`;
  }

  function render() {
    const cont = document.querySelector("#bracket");
    if (!cont) return;
    const prox = siguiente();
    const c = campeon();
    cont.innerHTML =
      rondas
        .map(
          (ronda, r) => `
        <div class="bk-ronda">
          <h4>${RONDAS[r]}</h4>
          <div class="bk-peleas">${ronda
            .map((p, m) => {
              const esProx = prox && prox.r === r && prox.m === m;
              const est = (lado) => (!p.ganador ? "" : p.ganador === lado ? "gana" : "pierde");
              return `
              <div class="bk-pelea ${esProx ? "proxima" : ""}">
                ${filaLuchador(p.a, est("a"))}
                ${filaLuchador(p.b, est("b"))}
                <small>${p.arena ? ARENAS[p.arena].nombre : "Terreno por sortear"}${esProx ? (peleando ? " · peleando…" : " · próxima") : ""}</small>
              </div>`;
            })
            .join("")}</div>
        </div>`
        )
        .join("") +
      `<div class="bk-ronda bk-campeon">
        <h4>Campeón</h4>
        <div class="bk-peleas"><div class="bk-trofeo ${c ? "listo" : ""}">
          ${c ? `<span class="big-emoji cat-${c.categoria}">${c.emoji}</span><b>${c.nombre}</b>` : `<span class="copa">?</span><b>Por definir</b>`}
        </div></div>
      </div>`;
    const btnSig = document.querySelector("#torneo-siguiente");
    btnSig.disabled = !prox || peleando;
    btnSig.textContent = !prox ? "Torneo terminado" : `Pelear: ${prox.p.a.nombre} vs ${prox.p.b.nombre}`;
    document.querySelector("#torneo-rapido").disabled = !prox || peleando;
  }

  function init() {
    document.querySelector("#torneo-nuevo").onclick = sortear;
    document.querySelector("#torneo-siguiente").onclick = pelearSiguiente;
    document.querySelector("#torneo-rapido").onclick = simularResto;
    sortear();
  }

  return { init };
})();
