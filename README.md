# ¿Quién Ganaría? 🥊

El debate de siempre entre amigos —*¿quién gana, un gorila o un tigre?*— convertido en una web.

Elige dos luchadores (animales de sabana, selva, agua, nieve, aire… y humanos), elige el terreno de la pelea y la web calcula quién ganaría, con qué probabilidad y **por qué**. Después, cada uno vota lo que cree.

## Cómo usarla

Es una web estática, sin instalación: abre `index.html` en el navegador.
Para publicarla gratis: GitHub Pages (Settings → Pages → rama principal) o Vercel/Netlify.

## Estructura

| Archivo | Qué hace |
|---|---|
| `js/data.js` | Luchadores, categorías y arenas. **Para agregar un animal, copia un bloque y edítalo.** |
| `js/engine.js` | Motor de combate: probabilidad de victoria y razones. |
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

Es entretenimiento: los números sirven para discutir, no para cerrar la discusión. 🍻
