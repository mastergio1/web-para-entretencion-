/*
 * Modo fiesta: los amigos anotan sus nombres, apuestan antes de cada pelea
 * y la página lleva la cuenta. Se guarda en este dispositivo (la idea es
 * pasarse el celular).
 *
 * Puntos: acertar = 1 punto. Acertar a un ganador que tenía menos de 35% = 3 puntos.
 */
const Fiesta = (() => {
  const CLAVE = "qg-fiesta";
  let jugadores = cargar(); // [{ nombre, puntos, aciertos, jugadas }]

  function cargar() {
    try {
      const j = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(jugadores));
    } catch {}
  }
  function esc(t) {
    const d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }

  function render() {
    const tabla = document.querySelector("#fiesta-tabla");
    const reset = document.querySelector("#fiesta-reset");
    if (!tabla) return;
    reset.hidden = jugadores.length === 0;
    if (!jugadores.length) {
      tabla.innerHTML = `<li class="vacio">Todavía no hay jugadores. Sin jugadores, las peleas empiezan directo.</li>`;
      return;
    }
    const orden = [...jugadores].sort((p, q) => q.puntos - p.puntos || q.aciertos - p.aciertos);
    const top = orden[0].puntos;
    tabla.innerHTML = orden
      .map(
        (j) => `
        <li class="${j.puntos === top && top > 0 ? "lider" : ""}">
          <span class="nombre">${esc(j.nombre)}</span>
          <span class="stats">${j.aciertos}/${j.jugadas} aciertos</span>
          <b class="puntos">${j.puntos} pts</b>
          <button class="quitar" data-quitar="${esc(j.nombre)}" aria-label="Quitar a ${esc(j.nombre)}">✕</button>
        </li>`
      )
      .join("");
    tabla.querySelectorAll("[data-quitar]").forEach(
      (b) =>
        (b.onclick = () => {
          jugadores = jugadores.filter((j) => j.nombre !== b.dataset.quitar);
          guardar();
          render();
        })
    );
  }

  function agregar(nombre) {
    nombre = nombre.trim().slice(0, 20);
    if (!nombre || jugadores.some((j) => j.nombre.toLowerCase() === nombre.toLowerCase())) return false;
    jugadores.push({ nombre, puntos: 0, aciertos: 0, jugadas: 0 });
    guardar();
    render();
    return true;
  }

  function reiniciar() {
    jugadores = jugadores.map((j) => ({ ...j, puntos: 0, aciertos: 0, jugadas: 0 }));
    guardar();
    render();
  }

  /*
   * Muestra el panel de apuestas dentro de `cont` y espera a que todos apuesten.
   * Resuelve { nombre: "a" | "b" }, o {} si no hay jugadores o se saltan las apuestas.
   */
  function apuestas(cont, a, b) {
    if (!jugadores.length) return Promise.resolve({});
    return new Promise((resolve) => {
      const elegido = {};
      cont.innerHTML = `
        <div class="apuestas">
          <p class="tag">Hagan sus apuestas</p>
          <div class="apuestas-vs">
            <span class="lado lado-a"><span class="big-emoji cat-${a.categoria}">${a.emoji}</span>${a.nombre}</span>
            <span class="vs-mini">VS</span>
            <span class="lado lado-b"><span class="big-emoji cat-${b.categoria}">${b.emoji}</span>${b.nombre}</span>
          </div>
          <ul class="apuestas-lista">
            ${jugadores
              .map(
                (j, i) => `
              <li>
                <span class="nombre">${esc(j.nombre)}</span>
                <button class="btn small vote-a" data-j="${i}" data-lado="a">${a.emoji} ${a.nombre}</button>
                <button class="btn small vote-b" data-j="${i}" data-lado="b">${b.emoji} ${b.nombre}</button>
              </li>`
              )
              .join("")}
          </ul>
          <div class="stage-btns">
            <button class="btn ghost small" data-accion="saltar">Pelear sin apostar</button>
            <button class="btn primary small" data-accion="listo" disabled>Faltan apuestas</button>
          </div>
        </div>`;
      const listo = cont.querySelector('[data-accion="listo"]');
      const actualizar = () => {
        const faltan = jugadores.length - Object.keys(elegido).length;
        listo.disabled = faltan > 0;
        listo.textContent = faltan > 0 ? `Faltan ${faltan} apuesta${faltan > 1 ? "s" : ""}` : "¡Que empiece!";
      };
      cont.querySelectorAll("[data-j]").forEach(
        (btn) =>
          (btn.onclick = () => {
            const j = jugadores[+btn.dataset.j];
            elegido[j.nombre] = btn.dataset.lado;
            btn.parentElement.querySelectorAll("[data-j]").forEach((x) => x.classList.toggle("elegido", x === btn));
            actualizar();
          })
      );
      cont.querySelector('[data-accion="saltar"]').onclick = () => resolve({});
      listo.onclick = () => resolve({ ...elegido });
    });
  }

  /* Suma puntos y devuelve el HTML del resumen de la ronda. */
  function resolver(apuestasHechas, ladoGanador, probGanador) {
    const nombres = Object.keys(apuestasHechas);
    if (!nombres.length) return "";
    const premio = probGanador < 0.35 ? 3 : 1;
    const filas = [];
    for (const j of jugadores) {
      const lado = apuestasHechas[j.nombre];
      if (!lado) continue;
      j.jugadas++;
      const acierto = lado === ladoGanador;
      if (acierto) {
        j.aciertos++;
        j.puntos += premio;
      }
      filas.push(
        `<li class="${acierto ? "acierto" : "fallo"}"><span>${esc(j.nombre)}</span><b>${acierto ? `+${premio}${premio > 1 ? " ¡Visionario!" : ""}` : "0"}</b></li>`
      );
    }
    guardar();
    render();
    return `<div class="fiesta-res"><h4>Apuestas de esta pelea</h4><ul>${filas.join("")}</ul></div>`;
  }

  function init() {
    const form = document.querySelector("#fiesta-form");
    const input = document.querySelector("#fiesta-nombre");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (agregar(input.value)) input.value = "";
      input.focus();
    });
    document.querySelector("#fiesta-reset").onclick = reiniciar;
    render();
  }

  return { init, apuestas, resolver, get activo() { return jugadores.length > 0; } };
})();
