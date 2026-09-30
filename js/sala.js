/*
 * Modo en línea: salas con Firebase Realtime Database.
 *
 * salas/<CÓDIGO>
 *   host        uid del anfitrión (el único que controla la sala)
 *   estado      "lobby" | "apuestas" | "pelea" | "resultado"
 *   ronda       número de la pelea actual
 *   pelea       { a, b, arena, armaA, armaB, cierre, semilla }
 *   jugadores   { uid: { nombre, online, ts } }        (cada uno escribe el suyo)
 *   apuestas    { ronda: { uid: "a" | "b" } }          (cada uno escribe la suya)
 *   puntos      { uid: { p, aciertos, jugadas } }      (solo el anfitrión)
 *   resultado   { ronda, ganador }
 *
 * La pelea se anima en cada celular con la misma semilla, así que todos ven
 * exactamente la misma pelea y el mismo ganador.
 */
(() => {
  const $ = (s) => document.querySelector(s);
  const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const SEGUNDOS_APUESTA = 25;
  const byId = Object.fromEntries(LUCHADORES.map((f) => [f.id, f]));

  let db, uid, offset = 0;
  let codigo = null;
  let ref = null;
  let sala = null; // último estado recibido
  let animando = false;
  let rondaAnimada = null;
  let reloj = null;
  let iniciando = false; // el anfitrión ya pidió empezar la pelea
  let rondaCerrada = null; // el anfitrión ya repartió los puntos de esta ronda
  let qrHecho = null;

  const esc = (t) => {
    const d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML;
  };
  const ahora = () => Date.now() + offset;
  const guardar = (k, v) => {
    try {
      v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    } catch {}
  };
  const leer = (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };

  function mostrar(pantalla) {
    $("#pantalla-inicio").hidden = pantalla !== "inicio";
    $("#pantalla-sala").hidden = pantalla !== "sala";
    $("#sala-estado").hidden = pantalla !== "cargando";
  }

  function error(msg) {
    const e = $("#inicio-error");
    e.textContent = msg;
    e.hidden = !msg;
  }

  function mensajeFirebase(e) {
    const m = String((e && (e.code || e.message)) || e);
    if (/permission|PERMISSION/.test(m)) {
      return "Firebase no dio permiso. Revisa que las reglas de seguridad estén publicadas.";
    }
    if (/operation-not-allowed|admin-restricted/.test(m)) {
      return "Falta activar el inicio de sesión Anónimo en Firebase (Authentication).";
    }
    return "No se pudo conectar. Revisa tu internet e inténtalo de nuevo.";
  }

  /* ───── armado de peleas ───── */
  function sorteo() {
    const pool = LUCHADORES;
    const a = pool[Math.floor(Math.random() * pool.length)];
    let b;
    do b = pool[Math.floor(Math.random() * pool.length)];
    while (b.id === a.id);
    const arenas = Object.keys(ARENAS);
    const buenas = arenas.filter((k) => adaptacion(a, k) > 0.3 && adaptacion(b, k) > 0.3);
    const lista = buenas.length ? buenas : arenas;
    const normales = Object.keys(ARMAS).filter((k) => !ARMAS[k].legendaria);
    const legendarias = Object.keys(ARMAS).filter((k) => ARMAS[k].legendaria);
    const arma = () => {
      const r = Math.random();
      if (r < 0.07) return legendarias[Math.floor(Math.random() * legendarias.length)];
      if (r < 0.35) return normales[Math.floor(Math.random() * normales.length)];
      return "";
    };
    return { a: a.id, b: b.id, arena: lista[Math.floor(Math.random() * lista.length)], armaA: arma(), armaB: arma() };
  }

  function datosPelea(p) {
    const a = byId[p.a];
    const b = byId[p.b];
    const armas = { a: p.armaA || null, b: p.armaB || null };
    const prob = probabilidadConArmas(a, b, p.arena, armas.a, armas.b);
    return { a, b, arena: p.arena, armas, prob };
  }

  /* ───── entrar / crear / salir ───── */
  function nombreValido() {
    const n = $("#input-nombre").value.trim().slice(0, 20);
    if (!n) {
      error("Escribe tu nombre para que tus amigos sepan quién eres.");
      $("#input-nombre").focus();
      return null;
    }
    guardar("qg-nombre", n);
    return n;
  }

  async function crear() {
    const nombre = nombreValido();
    if (!nombre) return;
    error("");
    $("#btn-crear").disabled = true;
    try {
      let c;
      for (let i = 0; i < 6; i++) {
        c = Array.from({ length: 5 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join("");
        const snap = await db.ref("salas/" + c + "/host").get();
        if (!snap.exists()) break;
      }
      await db.ref("salas/" + c).set({
        host: uid,
        creada: firebase.database.ServerValue.TIMESTAMP,
        estado: "lobby",
        ronda: 0,
        pelea: sorteo(),
      });
      await entrar(c, nombre);
    } catch (e) {
      error(mensajeFirebase(e));
    } finally {
      $("#btn-crear").disabled = false;
    }
  }

  async function unirme() {
    const nombre = nombreValido();
    if (!nombre) return;
    const c = $("#input-codigo").value.trim().toUpperCase();
    if (c.length !== 5) {
      error("El código tiene 5 letras. Pídeselo a quien creó la sala.");
      return;
    }
    error("");
    $("#btn-unirme").disabled = true;
    try {
      await entrar(c, nombre);
    } catch (e) {
      error(mensajeFirebase(e));
    } finally {
      $("#btn-unirme").disabled = false;
    }
  }

  async function entrar(c, nombre) {
    const existe = await db.ref("salas/" + c + "/host").get();
    if (!existe.exists()) {
      error(`No existe una sala con el código ${c}. Revisa las letras.`);
      guardar("qg-sala", null);
      return;
    }
    const yo = db.ref(`salas/${c}/jugadores/${uid}`);
    await yo.set({ nombre, online: true, ts: firebase.database.ServerValue.TIMESTAMP });
    yo.child("online").onDisconnect().set(false);

    codigo = c;
    guardar("qg-sala", c);
    history.replaceState(null, "", location.pathname + "?c=" + c);
    ref = db.ref("salas/" + c);
    ref.on(
      "value",
      (snap) => {
        sala = snap.val();
        render();
      },
      (e) => {
        error(mensajeFirebase(e));
        mostrar("inicio");
      }
    );
    mostrar("sala");
  }

  async function salir() {
    if (ref) ref.off();
    if (codigo && uid) {
      try {
        await db.ref(`salas/${codigo}/jugadores/${uid}/online`).set(false);
      } catch {}
    }
    if (pelea.actual) pelea.actual.cancelar();
    ref = null;
    sala = null;
    codigo = null;
    qrHecho = null;
    animando = false;
    guardar("qg-sala", null);
    history.replaceState(null, "", location.pathname);
    $("#sala-codigo-top").hidden = true;
    mostrar("inicio");
  }

  /* ───── acciones del anfitrión ───── */
  const esHost = () => sala && sala.host === uid;

  function actualizarPelea(cambios) {
    return db.ref(`salas/${codigo}/pelea`).update(cambios);
  }

  function abrirApuestas() {
    iniciando = false;
    return db.ref("salas/" + codigo).update({
      estado: "apuestas",
      ronda: (sala.ronda || 0) + 1,
      "pelea/cierre": ahora() + SEGUNDOS_APUESTA * 1000,
      "pelea/semilla": null,
    });
  }

  function empezarPelea() {
    if (iniciando || !esHost() || sala.estado !== "apuestas") return;
    iniciando = true;
    db.ref("salas/" + codigo)
      .update({ estado: "pelea", "pelea/semilla": Math.floor(Math.random() * 2 ** 31) })
      .catch(() => (iniciando = false));
  }

  /* El anfitrión reparte los puntos cuando termina su animación. */
  function cerrarRonda() {
    if (!esHost() || sala.estado !== "pelea" || sala.pelea.semilla == null) return;
    const r = sala.ronda;
    if (rondaCerrada === r) return;
    rondaCerrada = r;
    const d = datosPelea(sala.pelea);
    const res = resultadoConSemilla(d.a, d.b, d.arena, d.armas, sala.pelea.semilla);
    const probGanador = res.ganador === "a" ? d.prob : 1 - d.prob;
    const premio = probGanador < 0.35 ? 3 : 1;
    const apuestas = (sala.apuestas && sala.apuestas[r]) || {};
    const cambios = { estado: "resultado", resultado: { ronda: r, ganador: res.ganador, premio } };
    for (const [id, lado] of Object.entries(apuestas)) {
      const actual = (sala.puntos && sala.puntos[id]) || { p: 0, aciertos: 0, jugadas: 0 };
      const acierto = lado === res.ganador;
      cambios["puntos/" + id] = {
        p: actual.p + (acierto ? premio : 0),
        aciertos: actual.aciertos + (acierto ? 1 : 0),
        jugadas: actual.jugadas + 1,
      };
    }
    db.ref("salas/" + codigo).update(cambios);
  }

  function siguientePelea() {
    iniciando = false;
    return db.ref("salas/" + codigo).update({ estado: "lobby", pelea: sorteo() });
  }

  function apostar(lado) {
    db.ref(`salas/${codigo}/apuestas/${sala.ronda}/${uid}`).set(lado).catch(() => {});
  }

  /* ───── render ───── */
  function jugadoresOrdenados() {
    const js = sala.jugadores || {};
    const pts = sala.puntos || {};
    return Object.entries(js)
      .map(([id, j]) => ({ id, ...j, ...(pts[id] || { p: 0, aciertos: 0, jugadas: 0 }) }))
      .sort((x, y) => y.p - x.p || y.aciertos - x.aciertos || String(x.nombre).localeCompare(String(y.nombre)));
  }

  function renderJugadores() {
    const lista = jugadoresOrdenados();
    const apuestas = (sala.apuestas && sala.apuestas[sala.ronda]) || {};
    const top = lista.length ? lista[0].p : 0;
    $("#lista-jugadores").innerHTML = lista
      .map(
        (j) => `
        <li class="${j.p === top && top > 0 ? "lider" : ""} ${j.online === false ? "fuera" : ""}">
          <span class="nombre">${esc(j.nombre)}${j.id === sala.host ? ' <em class="rol">anfitrión</em>' : ""}${j.id === uid ? ' <em class="rol tu">tú</em>' : ""}</span>
          <span class="stats">${sala.estado === "apuestas" ? (apuestas[j.id] ? "✓ apostó" : "pensando…") : `${j.aciertos}/${j.jugadas}`}</span>
          <b class="puntos">${j.p} pts</b>
        </li>`
      )
      .join("");
  }

  function renderInvitar() {
    const link = location.origin + location.pathname + "?c=" + codigo;
    $("#codigo-grande").textContent = codigo;
    $("#sala-codigo-top").textContent = codigo;
    $("#sala-codigo-top").hidden = false;
    $("#btn-whatsapp").href =
      "https://wa.me/?text=" + encodeURIComponent(`¡Entra a mi sala de ¿Quién ganaría? Código ${codigo}: ${link}`);
    if (qrHecho !== codigo && window.QRCode) {
      $("#qr").innerHTML = "";
      new QRCode($("#qr"), { text: link, width: 150, height: 150, colorDark: "#14121a", colorLight: "#fff3d1" });
      qrHecho = codigo;
    }
    $("#bloque-invitar").hidden = sala.estado !== "lobby" && sala.estado !== "resultado";
  }

  function tarjetaPelea(d, titulo) {
    const arma = (id) => (id ? `<small class="arma-tag">${ARMAS[id].emoji} ${ARMAS[id].nombre}</small>` : "");
    return `
      <div class="apuestas">
        <p class="tag">${titulo}</p>
        <div class="apuestas-vs">
          <span class="lado"><span class="big-emoji cat-${d.a.categoria}">${d.a.emoji}</span>${esc(d.a.nombre)}${arma(d.armas.a)}</span>
          <span class="vs-mini">VS</span>
          <span class="lado"><span class="big-emoji cat-${d.b.categoria}">${d.b.emoji}</span>${esc(d.b.nombre)}${arma(d.armas.b)}</span>
        </div>
        <p class="muted small centro">${ARENAS[d.arena].nombre} · según los datos: ${Math.round(d.prob * 100)}% – ${100 - Math.round(d.prob * 100)}%</p>
      </div>`;
  }

  function renderEscena() {
    const cont = $("#bloque-escena");
    const d = datosPelea(sala.pelea);
    if (sala.estado === "lobby") {
      cont.innerHTML = esHost()
        ? `<p class="aviso">Elige la próxima pelea abajo y abre las apuestas cuando estén todos.</p>`
        : `${tarjetaPelea(d, "Próxima pelea")}<p class="aviso">Esperando a que el anfitrión abra las apuestas…</p>`;
      return;
    }
    if (sala.estado === "apuestas") {
      const mia = sala.apuestas && sala.apuestas[sala.ronda] && sala.apuestas[sala.ronda][uid];
      cont.innerHTML = `
        ${tarjetaPelea(d, `Pelea ${sala.ronda} · ¡Apuesten!`)}
        <div class="botones-apuesta">
          <button class="btn vote-a ${mia === "a" ? "elegido" : ""}" data-lado="a">${d.a.emoji} ${esc(d.a.nombre)}</button>
          <button class="btn vote-b ${mia === "b" ? "elegido" : ""}" data-lado="b">${d.b.emoji} ${esc(d.b.nombre)}</button>
        </div>
        <p class="cuenta"><b id="cuenta">–</b> segundos para apostar</p>
        ${esHost() ? `<div class="stage-btns"><button id="btn-pelear-ya" class="btn primary small">¡Pelear ya!</button></div>` : ""}`;
      cont.querySelectorAll("[data-lado]").forEach((b) => (b.onclick = () => apostar(b.dataset.lado)));
      if (esHost()) $("#btn-pelear-ya").onclick = empezarPelea;
      return;
    }
    if (sala.estado === "resultado" && sala.resultado) {
      const res = sala.resultado;
      const ganador = res.ganador === "a" ? d.a : d.b;
      const apuestas = (sala.apuestas && sala.apuestas[res.ronda]) || {};
      const js = sala.jugadores || {};
      const filas = Object.entries(apuestas)
        .map(([id, lado]) => {
          const ok = lado === res.ganador;
          return `<li class="${ok ? "acierto" : "fallo"}"><span>${esc((js[id] || {}).nombre || "Alguien")}</span><b>${ok ? `+${res.premio}${res.premio > 1 ? " ¡Visionario!" : ""}` : "0"}</b></li>`;
        })
        .join("");
      cont.innerHTML = `
        <div class="apuestas">
          <p class="tag">Pelea ${res.ronda} · Resultado</p>
          <div class="winner"><span class="big-emoji cat-${ganador.categoria}">${ganador.emoji}</span>
            <div><small>Ganó</small><h3>${esc(ganador.nombre)}</h3></div></div>
          <div class="fiesta-res"><h4>Apuestas</h4><ul>${filas || '<li class="fallo"><span>Nadie apostó</span></li>'}</ul></div>
          ${esHost() ? `<div class="stage-btns"><button id="btn-siguiente" class="btn primary small">Siguiente pelea</button></div>` : `<p class="aviso">Esperando la siguiente pelea…</p>`}
        </div>`;
      if (esHost()) $("#btn-siguiente").onclick = siguientePelea;
    }
  }

  function renderAnfitrion() {
    const bloque = $("#bloque-anfitrion");
    bloque.hidden = !(esHost() && sala.estado === "lobby");
    if (bloque.hidden) return;
    const p = sala.pelea;
    $("#cfg-a").value = p.a;
    $("#cfg-b").value = p.b;
    $("#cfg-arena").value = p.arena;
    $("#cfg-arma-a").value = p.armaA || "";
    $("#cfg-arma-b").value = p.armaB || "";
    const d = datosPelea(p);
    $("#cfg-prob").textContent = `Según los datos: ${d.a.nombre} ${Math.round(d.prob * 100)}% – ${100 - Math.round(d.prob * 100)}% ${d.b.nombre}`;
  }

  async function correrPelea() {
    animando = true;
    rondaAnimada = sala.ronda;
    const d = datosPelea(sala.pelea);
    const cont = $("#bloque-escena");
    cont.innerHTML = `<div class="fight" id="escena-pelea"></div>`;
    cont.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      await animarPelea($("#escena-pelea"), d.a, d.b, d.arena, d.armas, sala.pelea.semilla);
    } catch (e) {
      console.error(e);
    }
    await new Promise((r) => setTimeout(r, 2500)); // un momento para ver el K.O.
    animando = false;
    if (esHost()) cerrarRonda();
    render();
  }

  function render() {
    if (!sala) {
      if (codigo) {
        error("La sala se cerró.");
        salir();
      }
      return;
    }
    renderJugadores();
    renderInvitar();
    renderAnfitrion();
    if (animando) return; // no tocar el escenario durante la pelea
    if (sala.estado === "pelea" && sala.pelea.semilla != null && rondaAnimada !== sala.ronda) {
      correrPelea();
      return;
    }
    if (sala.estado === "pelea") {
      $("#bloque-escena").innerHTML = `<p class="aviso">La pelea está en curso…</p>`;
      if (esHost() && rondaAnimada === sala.ronda) cerrarRonda();
      return;
    }
    renderEscena();
  }

  /* Cuenta regresiva de apuestas (y el anfitrión empieza la pelea al llegar a 0 o cuando todos apostaron). */
  function tic() {
    if (!sala || sala.estado !== "apuestas") return;
    const faltan = Math.max(0, Math.ceil((sala.pelea.cierre - ahora()) / 1000));
    const el = $("#cuenta");
    if (el) el.textContent = faltan;
    if (!esHost()) return;
    const conectados = Object.entries(sala.jugadores || {}).filter(([, j]) => j.online !== false);
    const apuestas = (sala.apuestas && sala.apuestas[sala.ronda]) || {};
    const todos = conectados.length > 0 && conectados.every(([id]) => apuestas[id]);
    if (faltan === 0 || todos) empezarPelea();
  }

  /* ───── selects del anfitrión ───── */
  function llenarSelects() {
    const grupos = Object.entries(CATEGORIAS)
      .map(
        ([k, c]) =>
          `<optgroup label="${c.nombre}">${LUCHADORES.filter((f) => f.categoria === k)
            .map((f) => `<option value="${f.id}">${f.emoji} ${f.nombre}</option>`)
            .join("")}</optgroup>`
      )
      .join("");
    $("#cfg-a").innerHTML = grupos;
    $("#cfg-b").innerHTML = grupos;
    $("#cfg-arena").innerHTML = Object.entries(ARENAS)
      .map(([k, a]) => `<option value="${k}">${a.nombre}</option>`)
      .join("");
    const armas = (leg) =>
      Object.entries(ARMAS)
        .filter(([, w]) => !!w.legendaria === leg)
        .map(([k, w]) => `<option value="${k}">${w.emoji} ${w.nombre}</option>`)
        .join("");
    const opcionesArmas = `<option value="">Sin arma</option><optgroup label="Rudimentarias">${armas(false)}</optgroup><optgroup label="Legendarias">${armas(true)}</optgroup>`;
    $("#cfg-arma-a").innerHTML = opcionesArmas;
    $("#cfg-arma-b").innerHTML = opcionesArmas;
    const campo = { "#cfg-a": "a", "#cfg-b": "b", "#cfg-arena": "arena", "#cfg-arma-a": "armaA", "#cfg-arma-b": "armaB" };
    for (const [sel, key] of Object.entries(campo)) {
      $(sel).onchange = () => {
        const v = $(sel).value;
        if ((key === "a" && v === sala.pelea.b) || (key === "b" && v === sala.pelea.a)) {
          renderAnfitrion();
          return;
        }
        actualizarPelea({ [key]: v });
      };
    }
  }

  /* ───── inicio ───── */
  function init() {
    llenarSelects();
    const params = new URLSearchParams(location.search);
    const c = (params.get("c") || leer("qg-sala") || "").toUpperCase();
    $("#input-codigo").value = c;
    $("#input-nombre").value = leer("qg-nombre") || "";
    $("#btn-crear").onclick = crear;
    $("#btn-unirme").onclick = unirme;
    $("#btn-salir").onclick = salir;
    $("#btn-sortear").onclick = () => actualizarPelea(sorteo());
    $("#btn-abrir").onclick = abrirApuestas;
    $("#btn-copiar-link").onclick = () => {
      const link = location.origin + location.pathname + "?c=" + codigo;
      const ok = () => ($("#btn-copiar-link").textContent = "¡Copiado!");
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, () => {});
    };
    setInterval(tic, 500);

    if (!window.firebase || typeof FIREBASE_CONFIG === "undefined") {
      $("#sala-estado").textContent =
        "El modo en línea no pudo cargar. Ábrelo desde el link de GitHub Pages con conexión a internet.";
      return;
    }
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    db.ref(".info/serverTimeOffset").on("value", (s) => (offset = s.val() || 0));
    firebase
      .auth()
      .signInAnonymously()
      .then(async (cred) => {
        uid = cred.user.uid;
        const nombre = leer("qg-nombre");
        // Si ya estaba en una sala y tiene nombre, volver a entrar directo
        if (c && nombre && (params.get("c") || "").toUpperCase() === leer("qg-sala")) {
          try {
            await entrar(c, nombre);
            return;
          } catch {}
        }
        mostrar("inicio");
      })
      .catch((e) => {
        $("#sala-estado").textContent = mensajeFirebase(e);
      });
  }

  init();
})();
