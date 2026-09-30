# ¿Quién Ganaría? 🥊

El debate de siempre entre amigos —*¿quién gana, un gorila o un tigre?*— convertido en una web.

Elige dos luchadores (animales de sabana, selva, agua, nieve, aire, bichos y enjambres… y humanos de todo tipo), elige el terreno y **mira la pelea animada**: barras de vida, golpes, un narrador y momentos absurdos. El favorito gana casi siempre… pero a veces hay sorpresa. Después, la web muestra lo que dicen los datos, **por qué**, y cada uno vota lo que cree.

## Qué se puede hacer

- **Pelea 1 contra 1** animada, con armas rudimentarias y legendarias.
- **Jugar en línea (`sala.html`):** uno crea una sala, los demás entran desde su celular con un código de 5 letras o un QR. Todos apuestan y ven la misma pelea al mismo tiempo; los puntos se actualizan en vivo. Usa Firebase Realtime Database.
- **Modo fiesta:** anoten sus nombres, apuesten antes de cada pelea y la web lleva los puntos (se guarda en el dispositivo).
- **Torneo de la noche:** 8 luchadores al azar, eliminación directa hasta el campeón.
- **Lo que opina la gente:** los duelos más votados y los más polémicos. Abierta desde Claude, suma los votos de todos; en otro lugar, los de ese dispositivo.
- **Enciclopedia** con la ficha de cada luchador.

## Cómo usarla

Es una web estática, sin instalación: abre `index.html` en el navegador.

### Modo en línea (Firebase)

- La configuración pública está en `js/firebase-config.js`.
- En la consola de Firebase hay que activar **Authentication → Anónimo** y pegar el contenido de `firebase-reglas.json` en **Realtime Database → Reglas**.
- Solo funciona desde la web publicada (GitHub Pages), no dentro de Claude.

### Publicarla gratis con GitHub Pages

1. En GitHub: **Settings → Pages**.
2. En *Build and deployment*, elige **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda.
3. En un par de minutos queda en `https://<tu-usuario>.github.io/web-para-entretencion-/`.

## Estructura

| Archivo | Qué hace |
|---|---|
| `js/data.js` | Luchadores, categorías y arenas. **Para agregar un animal, copia un bloque y edítalo.** |
| `js/engine.js` | Motor de combate: probabilidad de victoria y razones. |
| `js/armas.js` | Armas rudimentarias: ¿el luchador sabrá usarla? + frases absurdas. |
| `js/golpes.js` | Golpes de cada luchador y eventos absurdos para la animación. |
| `js/fight.js` | Animación de la pelea (el ganador se sortea con la probabilidad del motor). |
| `js/votos.js` | Votos: compartidos (dentro de Claude) o en el dispositivo. |
| `js/fiesta.js` | Modo fiesta: jugadores, apuestas y puntos. |
| `js/torneo.js` | Torneo de 8 luchadores. |
| `js/sala.js` | Modo en línea: salas, apuestas y pelea sincronizada con Firebase. |
| `js/app.js` | Interfaz: selector, resultado, votos, enciclopedia. |
| `css/styles.css` | Estilos (responsive). |

## Cómo se calcula

```
poder = calidad de combate × peso^0.33 × adaptación al terreno
P(A gana) = poderA³ / (poderA³ + poderB³)
```

- **Datos reales (aprox.):** peso, tamaño, velocidad máxima, fuerza de mordida (PSI).
- **Atributos 0-100 (estimados):** ataque, defensa, fuerza relativa, agilidad, ferocidad, resistencia, inteligencia.
- **Terreno:** un tiburón en la sabana no tiene nada que hacer; un gorila en el océano tampoco.
- **Enjambres:** usan un `pesoEfectivo` (20.000 abejas no se noquean de un manotazo).
- **Armas:** si el luchador logra usarla, multiplica su poder (palo ×1,3 … machete y hacha ×2). Cada luchador tiene una probabilidad de saber usarla (humanos ~95%, chimpancé 60%, tiburón 3%). La probabilidad mostrada promedia los casos en que la usa y en que no; en la animación se sortea si la usa.
- **Armas legendarias** (Nokia 3310, chancla de la abuela, pan de hace 3 días, control universal, pato de hule cósmico): el arma elige a su portador con la misma probabilidad baja para cualquiera (3-9%). Si lo elige, gana el 85-97% de las veces, aunque sea una hormiga contra un elefante.
- **Especiales:** ventajas concretas contra ciertos rivales (las abejas asustan a los elefantes, el tejón melero asalta colmenas…).

Es entretenimiento: los números sirven para discutir, no para cerrar la discusión. 🍻
