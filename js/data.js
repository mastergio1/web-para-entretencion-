/*
 * Base de datos de luchadores.
 *
 * Datos reales (aproximados, adulto promedio / macho grande cuando aplica):
 *   peso (kg), largo/altura (m), velocidad máxima (km/h), mordida (PSI).
 *   mordida: null cuando no aplica o no hay medición confiable.
 *
 * Atributos 0-100 (estimaciones para el juego, basadas en su anatomía y comportamiento):
 *   ataque       – letalidad de sus armas naturales (colmillos, garras, cuernos, veneno…)
 *   defensa      – piel, armadura, grasa, huesos: qué tanto aguanta
 *   fuerza       – fuerza RELATIVA a su tamaño (el peso ya se cuenta aparte)
 *   agilidad     – reflejos, maniobrabilidad
 *   ferocidad    – agresividad y disposición a pelear hasta el final
 *   resistencia  – cuánto aguanta una pelea larga
 *   inteligencia – estrategia, capacidad de adaptarse
 *
 * medio: 'tierra' | 'agua' | 'anfibio' | 'aire'
 * nado:  0-1, qué tan bien se defiende un animal terrestre en el agua
 * hogar: arenas donde vive (bonus de local)
 * arenas: ajustes manuales por arena (multiplicador que reemplaza el cálculo)
 */
const CATEGORIAS = {
  sabana: { nombre: "Sabana / Tierra", emoji: "🌾" },
  selva: { nombre: "Selva", emoji: "🌴" },
  agua: { nombre: "Agua", emoji: "🌊" },
  nieve: { nombre: "Nieve", emoji: "❄️" },
  aire: { nombre: "Aire", emoji: "🦅" },
  humano: { nombre: "Humanos", emoji: "🧍" },
};

const ARENAS = {
  sabana: { nombre: "Sabana", emoji: "🌾", desc: "Terreno abierto y seco. Sin ventajas para nadie... salvo para los de tierra." },
  selva: { nombre: "Selva", emoji: "🌴", desc: "Vegetación densa, árboles y emboscadas." },
  rio: { nombre: "Río / Pantano", emoji: "🐊", desc: "Agua turbia hasta el cuello. El reino de los anfibios." },
  oceano: { nombre: "Océano", emoji: "🌊", desc: "Mar abierto. Si no sabes nadar, ya perdiste." },
  nieve: { nombre: "Nieve / Hielo", emoji: "❄️", desc: "Frío extremo. Los animales polares juegan de local." },
};

const LUCHADORES = [
  // ───────── SABANA / TIERRA ─────────
  {
    id: "leon", nombre: "León", emoji: "🦁", categoria: "sabana", medio: "tierra", nado: 0.3, hogar: ["sabana"],
    peso: 190, largo: 2.5, velocidad: 80, mordida: 650,
    ataque: 90, defensa: 55, fuerza: 80, agilidad: 85, ferocidad: 85, resistencia: 50, inteligencia: 55,
    armas: "Colmillos de 7 cm y garras retráctiles",
    fortaleza: "Melena que protege el cuello y experiencia peleando contra otros leones.",
    debilidad: "Poca resistencia: se cansa rápido tras un sprint.",
    dato: "Su rugido se oye a 8 km de distancia.",
  },
  {
    id: "elefante", nombre: "Elefante africano", emoji: "🐘", categoria: "sabana", medio: "tierra", nado: 0.6, hogar: ["sabana", "selva"],
    peso: 6000, largo: 6.5, velocidad: 40, mordida: null,
    ataque: 75, defensa: 95, fuerza: 80, agilidad: 25, ferocidad: 60, resistencia: 70, inteligencia: 80,
    armas: "Colmillos de marfil, trompa y 6 toneladas para aplastar",
    fortaleza: "Piel de 2,5 cm de grosor y un tamaño que nadie puede derribar.",
    debilidad: "Lento para girar; las crías son vulnerables (los adultos casi no).",
    dato: "Es el animal terrestre más grande del planeta.",
  },
  {
    id: "rinoceronte", nombre: "Rinoceronte blanco", emoji: "🦏", categoria: "sabana", medio: "tierra", nado: 0.3, hogar: ["sabana"],
    peso: 2300, largo: 4, velocidad: 50, mordida: null,
    ataque: 80, defensa: 95, fuerza: 80, agilidad: 35, ferocidad: 70, resistencia: 60, inteligencia: 35,
    armas: "Cuerno de hasta 1,5 m y embestida de tanque",
    fortaleza: "Piel-armadura de hasta 5 cm de grosor.",
    debilidad: "Muy mala vista: ataca a lo que se mueve.",
    dato: "Su cuerno es de queratina, lo mismo que tus uñas.",
  },
  {
    id: "hipopotamo", nombre: "Hipopótamo", emoji: "🦛", categoria: "sabana", medio: "anfibio", nado: 1, hogar: ["rio", "sabana"],
    peso: 1500, largo: 4, velocidad: 30, mordida: 1800,
    ataque: 85, defensa: 85, fuerza: 75, agilidad: 30, ferocidad: 95, resistencia: 55, inteligencia: 35,
    arenas: { oceano: 0.6 },
    armas: "Colmillos de 50 cm y mandíbula que abre 150°",
    fortaleza: "Territorial y extremadamente agresivo. Mata a más humanos que los leones.",
    debilidad: "Se sobrecalienta fuera del agua.",
    dato: "Suda un líquido rojo que funciona como protector solar.",
  },
  {
    id: "grizzly", nombre: "Oso grizzly", emoji: "🐻", categoria: "sabana", medio: "tierra", nado: 0.6, hogar: ["sabana", "selva", "nieve"], frio: true,
    peso: 300, largo: 2.2, velocidad: 56, mordida: 1160,
    ataque: 90, defensa: 75, fuerza: 90, agilidad: 55, ferocidad: 80, resistencia: 75, inteligencia: 60,
    armas: "Garras de 10 cm y zarpazos que rompen cráneos",
    fortaleza: "Capa de grasa y músculo que absorbe golpes; puede pelear de pie.",
    debilidad: "Menos ágil que los felinos.",
    dato: "Un zarpazo puede romperle la columna a un alce.",
  },
  {
    id: "guepardo", nombre: "Guepardo", emoji: "🐆", categoria: "sabana", medio: "tierra", nado: 0.2, hogar: ["sabana"],
    peso: 50, largo: 1.3, velocidad: 110, mordida: 400,
    ataque: 65, defensa: 25, fuerza: 55, agilidad: 100, ferocidad: 40, resistencia: 25, inteligencia: 50,
    armas: "Velocidad pura y mordida al cuello",
    fortaleza: "El animal terrestre más rápido del mundo.",
    debilidad: "Frágil: evita las peleas porque una herida lo condena.",
    dato: "Pasa de 0 a 100 km/h en unos 3 segundos.",
  },
  {
    id: "hiena", nombre: "Hiena manchada", emoji: "🐺", categoria: "sabana", medio: "tierra", nado: 0.4, hogar: ["sabana"],
    peso: 60, largo: 1.5, velocidad: 60, mordida: 1100,
    ataque: 80, defensa: 50, fuerza: 75, agilidad: 65, ferocidad: 80, resistencia: 90, inteligencia: 70,
    armas: "Mandíbula que tritura huesos",
    fortaleza: "Resistencia infinita: persigue a su presa kilómetros.",
    debilidad: "Sola es mucho menos peligrosa que en manada.",
    dato: "Puede comerse un tercio de su peso en una sola comida.",
  },
  {
    id: "bufalo", nombre: "Búfalo cafre", emoji: "🐃", categoria: "sabana", medio: "tierra", nado: 0.5, hogar: ["sabana"],
    peso: 750, largo: 3, velocidad: 57, mordida: null,
    ataque: 70, defensa: 80, fuerza: 80, agilidad: 45, ferocidad: 90, resistencia: 75, inteligencia: 45,
    armas: "Cuernos fusionados en un 'casco' y embestida",
    fortaleza: "Apodado 'la muerte negra': rencoroso y vengativo.",
    debilidad: "Sus cuernos cubren poco los flancos.",
    dato: "Se sabe que dan la vuelta para emboscar a quien los persigue.",
  },
  {
    id: "canguro", nombre: "Canguro rojo", emoji: "🦘", categoria: "sabana", medio: "tierra", nado: 0.4, hogar: ["sabana"],
    peso: 85, largo: 1.6, velocidad: 70, mordida: null,
    ataque: 55, defensa: 40, fuerza: 80, agilidad: 80, ferocidad: 55, resistencia: 70, inteligencia: 40,
    armas: "Patadas con garras capaces de abrir un vientre",
    fortaleza: "Se apoya en la cola para patear con ambas piernas.",
    debilidad: "Sin colmillos ni garras delanteras de verdad.",
    dato: "Salta hasta 9 metros de un solo brinco.",
  },
  {
    id: "lobo", nombre: "Lobo gris", emoji: "🐺", categoria: "sabana", medio: "tierra", nado: 0.5, hogar: ["sabana", "nieve", "selva"], frio: true,
    peso: 45, largo: 1.6, velocidad: 60, mordida: 400,
    ataque: 75, defensa: 40, fuerza: 60, agilidad: 80, ferocidad: 70, resistencia: 90, inteligencia: 70,
    armas: "Colmillos y trabajo en equipo",
    fortaleza: "Estratega nato y muy resistente.",
    debilidad: "Solo, sin manada, pierde su mayor arma.",
    dato: "Puede recorrer 70 km en una sola noche.",
  },
  {
    id: "komodo", nombre: "Dragón de Komodo", emoji: "🦎", categoria: "sabana", medio: "tierra", nado: 0.6, hogar: ["sabana", "selva"],
    peso: 70, largo: 3, velocidad: 20, mordida: 600,
    ataque: 80, defensa: 70, fuerza: 60, agilidad: 40, ferocidad: 70, resistencia: 50, inteligencia: 35,
    armas: "Dientes aserrados y veneno anticoagulante",
    fortaleza: "Piel con osteodermos (mini-huesos) como cota de malla.",
    debilidad: "Su veneno tarda horas: no gana peleas rápidas.",
    dato: "El lagarto más grande del mundo.",
  },
  {
    id: "tejon", nombre: "Tejón melero", emoji: "🦡", categoria: "sabana", medio: "tierra", nado: 0.3, hogar: ["sabana", "selva"],
    peso: 12, largo: 0.8, velocidad: 30, mordida: null,
    ataque: 60, defensa: 90, fuerza: 80, agilidad: 70, ferocidad: 100, resistencia: 80, inteligencia: 60,
    armas: "Garras excavadoras y actitud de 'no me importa nada'",
    fortaleza: "Piel suelta y gruesa: si lo muerden, se gira y contraataca.",
    debilidad: "Es muy pequeño contra depredadores grandes.",
    dato: "Es parcialmente resistente al veneno de cobra.",
  },

  // ───────── SELVA ─────────
  {
    id: "tigre", nombre: "Tigre de Bengala", emoji: "🐅", categoria: "selva", medio: "tierra", nado: 0.8, hogar: ["selva"],
    peso: 220, largo: 2.9, velocidad: 65, mordida: 1050,
    ataque: 95, defensa: 60, fuerza: 85, agilidad: 85, ferocidad: 85, resistencia: 60, inteligencia: 55,
    armas: "Colmillos de 9 cm y garras de 10 cm",
    fortaleza: "Cazador solitario acostumbrado a matar presas más grandes que él.",
    debilidad: "Evita peleas largas: una herida grave lo deja sin cazar.",
    dato: "A diferencia de casi todos los gatos, ama el agua.",
  },
  {
    id: "gorila", nombre: "Gorila espalda plateada", emoji: "🦍", categoria: "selva", medio: "tierra", nado: 0.1, hogar: ["selva"],
    peso: 160, largo: 1.7, velocidad: 40, mordida: 1300,
    ataque: 70, defensa: 60, fuerza: 95, agilidad: 60, ferocidad: 55, resistencia: 60, inteligencia: 75,
    armas: "Brazos descomunales y colmillos de 5 cm",
    fortaleza: "Fuerza bruta estimada en varias veces la de un humano.",
    debilidad: "No es depredador: no está 'diseñado' para matar. No sabe nadar.",
    dato: "Pese a su fama, es vegetariano y pacífico.",
  },
  {
    id: "jaguar", nombre: "Jaguar", emoji: "🐆", categoria: "selva", medio: "tierra", nado: 0.9, hogar: ["selva", "rio"],
    peso: 100, largo: 1.8, velocidad: 80, mordida: 1500,
    ataque: 95, defensa: 55, fuerza: 90, agilidad: 85, ferocidad: 80, resistencia: 55, inteligencia: 55,
    armas: "La mordida más potente de los felinos (atraviesa cráneos)",
    fortaleza: "Caza caimanes dentro del agua.",
    debilidad: "Más pequeño que tigres y leones.",
    dato: "Su nombre viene del tupí 'yaguara': el que mata de un salto.",
  },
  {
    id: "chimpance", nombre: "Chimpancé", emoji: "🐒", categoria: "selva", medio: "tierra", nado: 0.05, hogar: ["selva"],
    peso: 60, largo: 1.2, velocidad: 40, mordida: 1300,
    ataque: 60, defensa: 40, fuerza: 90, agilidad: 80, ferocidad: 75, resistencia: 60, inteligencia: 80,
    armas: "Mordida brutal y fuerza de tracción superior a la humana",
    fortaleza: "Inteligente, usa herramientas y pelea en grupo.",
    debilidad: "No sabe nadar.",
    dato: "Es ~1,35 veces más fuerte que un humano de su mismo peso.",
  },
  {
    id: "anaconda", nombre: "Anaconda verde", emoji: "🐍", categoria: "selva", medio: "anfibio", nado: 1, hogar: ["selva", "rio"],
    peso: 100, largo: 6, velocidad: 8, mordida: null,
    ataque: 75, defensa: 55, fuerza: 95, agilidad: 45, ferocidad: 50, resistencia: 70, inteligencia: 30,
    arenas: { sabana: 0.7, nieve: 0.2, oceano: 0.7 },
    armas: "Constricción: asfixia a su presa",
    fortaleza: "En el agua es casi imposible escapar de ella.",
    debilidad: "Torpe y lenta en tierra firme.",
    dato: "La serpiente más pesada del mundo.",
  },
  {
    id: "cocodrilo", nombre: "Cocodrilo de agua salada", emoji: "🐊", categoria: "selva", medio: "anfibio", nado: 1, hogar: ["rio", "oceano", "selva"],
    peso: 1000, largo: 5.5, velocidad: 29, mordida: 3700,
    ataque: 95, defensa: 90, fuerza: 80, agilidad: 40, ferocidad: 85, resistencia: 50, inteligencia: 40,
    arenas: { oceano: 1.0, sabana: 0.75, nieve: 0.3 },
    armas: "La mordida más fuerte jamás medida + 'giro de la muerte'",
    fortaleza: "Armadura de escamas óseas y emboscada perfecta.",
    debilidad: "En tierra se cansa rápido; su mandíbula abre con poca fuerza.",
    dato: "Su mordida (3.700 PSI) es el récord medido en un animal vivo.",
  },
  {
    id: "arpia", nombre: "Águila arpía", emoji: "🦅", categoria: "aire", medio: "aire", nado: 0, hogar: ["selva"],
    peso: 8, largo: 1, velocidad: 80, mordida: null,
    ataque: 75, defensa: 20, fuerza: 90, agilidad: 90, ferocidad: 70, resistencia: 50, inteligencia: 50,
    armas: "Garras de 13 cm, más grandes que las de un oso",
    fortaleza: "Caza monos y perezosos arrancándolos de los árboles.",
    debilidad: "Frágil si la pelea se vuelve cuerpo a cuerpo en el suelo.",
    dato: "Sus garras aprietan con más de 50 kg de presión.",
  },

  // ───────── AGUA ─────────
  {
    id: "tiburon", nombre: "Tiburón blanco", emoji: "🦈", categoria: "agua", medio: "agua", nado: 1, hogar: ["oceano"],
    peso: 1100, largo: 5, velocidad: 56, mordida: 4000,
    ataque: 95, defensa: 65, fuerza: 80, agilidad: 70, ferocidad: 80, resistencia: 70, inteligencia: 45,
    armas: "300 dientes aserrados en varias filas",
    fortaleza: "Ataque sorpresa desde abajo a toda velocidad.",
    debilidad: "Fuera del agua no dura nada. Las orcas lo cazan.",
    dato: "Huele una gota de sangre en 100 litros de agua.",
  },
  {
    id: "orca", nombre: "Orca", emoji: "🐋", categoria: "agua", medio: "agua", nado: 1, hogar: ["oceano", "nieve"],
    peso: 5500, largo: 8, velocidad: 56, mordida: null,
    ataque: 90, defensa: 80, fuerza: 85, agilidad: 70, ferocidad: 75, resistencia: 90, inteligencia: 95,
    arenas: { nieve: 0.5 },
    armas: "Dientes de 10 cm, embestidas y tácticas de caza",
    fortaleza: "Superdepredador: caza tiburones blancos y ballenas.",
    debilidad: "Necesita agua sí o sí.",
    dato: "Les arranca el hígado a los tiburones blancos con precisión quirúrgica.",
  },
  {
    id: "pulpo", nombre: "Pulpo gigante del Pacífico", emoji: "🐙", categoria: "agua", medio: "agua", nado: 1, hogar: ["oceano"],
    peso: 15, largo: 4, velocidad: 40, mordida: null,
    ataque: 45, defensa: 30, fuerza: 85, agilidad: 85, ferocidad: 30, resistencia: 40, inteligencia: 95,
    armas: "Ocho brazos con 2.000 ventosas y pico venenoso",
    fortaleza: "Camuflaje perfecto y tinta para escapar.",
    debilidad: "Cuerpo blando, sin huesos.",
    dato: "Tiene tres corazones y sangre azul.",
  },
  {
    id: "morena", nombre: "Morena gigante", emoji: "🐍", categoria: "agua", medio: "agua", nado: 1, hogar: ["oceano"],
    peso: 30, largo: 3, velocidad: 20, mordida: null,
    ataque: 70, defensa: 40, fuerza: 60, agilidad: 70, ferocidad: 65, resistencia: 50, inteligencia: 35,
    armas: "Doble mandíbula (como en la película Alien)",
    fortaleza: "Emboscada desde su cueva.",
    debilidad: "No persigue: si te alejas, estás a salvo.",
    dato: "Tiene una segunda mandíbula en la garganta.",
  },
  {
    id: "delfin", nombre: "Delfín mular", emoji: "🐬", categoria: "agua", medio: "agua", nado: 1, hogar: ["oceano"],
    peso: 300, largo: 3, velocidad: 35, mordida: null,
    ataque: 45, defensa: 55, fuerza: 70, agilidad: 90, ferocidad: 45, resistencia: 85, inteligencia: 95,
    armas: "Embestidas con el hocico a toda velocidad",
    fortaleza: "Se sabe que matan tiburones a golpes en grupo.",
    debilidad: "Dientes pensados para peces, no para pelear.",
    dato: "Duermen con medio cerebro a la vez.",
  },

  // ───────── NIEVE ─────────
  {
    id: "oso_polar", nombre: "Oso polar", emoji: "🐻‍❄️", categoria: "nieve", medio: "tierra", nado: 0.9, hogar: ["nieve"], frio: true,
    peso: 450, largo: 2.5, velocidad: 40, mordida: 1200,
    ataque: 90, defensa: 80, fuerza: 90, agilidad: 50, ferocidad: 80, resistencia: 75, inteligencia: 60,
    armas: "Garras de 10 cm y zarpazo de 500+ kg",
    fortaleza: "El carnívoro terrestre más grande del mundo.",
    debilidad: "Se sobrecalienta con facilidad fuera del frío.",
    dato: "Su piel es negra y su pelo es transparente, no blanco.",
  },
  {
    id: "tigre_siberiano", nombre: "Tigre siberiano", emoji: "🐅", categoria: "nieve", medio: "tierra", nado: 0.8, hogar: ["nieve", "selva"], frio: true,
    peso: 280, largo: 3.3, velocidad: 60, mordida: 1050,
    ataque: 95, defensa: 60, fuerza: 85, agilidad: 80, ferocidad: 85, resistencia: 60, inteligencia: 55,
    armas: "Colmillos de 10 cm y garras de 10 cm",
    fortaleza: "El felino más grande del mundo. Caza osos pardos.",
    debilidad: "Igual que todo tigre: le teme a las heridas graves.",
    dato: "Se han documentado tigres siberianos matando osos.",
  },
  {
    id: "morsa", nombre: "Morsa", emoji: "🦭", categoria: "nieve", medio: "anfibio", nado: 1, hogar: ["nieve", "oceano"], frio: true,
    peso: 1200, largo: 3.5, velocidad: 35, mordida: null,
    ataque: 70, defensa: 85, fuerza: 70, agilidad: 30, ferocidad: 65, resistencia: 65, inteligencia: 50,
    arenas: { sabana: 0.5, selva: 0.4 },
    armas: "Colmillos de hasta 1 metro",
    fortaleza: "Piel de 4 cm y 10 cm de grasa: los osos polares lo piensan dos veces.",
    debilidad: "Muy torpe fuera del agua.",
    dato: "Usa sus colmillos como piolet para salir del agua.",
  },
  {
    id: "gloton", nombre: "Glotón", emoji: "🦡", categoria: "nieve", medio: "tierra", nado: 0.4, hogar: ["nieve"], frio: true,
    peso: 18, largo: 1, velocidad: 48, mordida: null,
    ataque: 65, defensa: 70, fuerza: 85, agilidad: 70, ferocidad: 100, resistencia: 85, inteligencia: 60,
    armas: "Garras y mordida capaz de romper huesos congelados",
    fortaleza: "Le roba presas a lobos y osos. Sin miedo alguno.",
    debilidad: "Pequeño: la ferocidad no compensa 20 veces menos peso.",
    dato: "Se le conoce como 'el demonio del norte'.",
  },
  {
    id: "leopardo_nieves", nombre: "Leopardo de las nieves", emoji: "🐆", categoria: "nieve", medio: "tierra", nado: 0.3, hogar: ["nieve"], frio: true,
    peso: 45, largo: 1.3, velocidad: 65, mordida: 500,
    ataque: 75, defensa: 45, fuerza: 80, agilidad: 95, ferocidad: 55, resistencia: 60, inteligencia: 55,
    armas: "Colmillos y saltos de 15 metros",
    fortaleza: "Maestro de las montañas: caza cabras en acantilados.",
    debilidad: "Tímido, evita confrontaciones.",
    dato: "Usa su cola como bufanda para dormir.",
  },

  // ───────── AIRE ─────────
  {
    id: "aguila_real", nombre: "Águila real", emoji: "🦅", categoria: "aire", medio: "aire", nado: 0, hogar: ["sabana", "nieve"],
    peso: 5, largo: 0.9, velocidad: 240, mordida: null,
    ataque: 70, defensa: 15, fuerza: 85, agilidad: 95, ferocidad: 70, resistencia: 50, inteligencia: 50,
    armas: "Garras y picada a 240 km/h",
    fortaleza: "Ha cazado ciervos jóvenes y hasta lobos (con ayuda humana en Asia).",
    debilidad: "Si la atrapan en el suelo, pierde casi toda ventaja.",
    dato: "Su vista es 4-8 veces más aguda que la humana.",
  },

  // ───────── HUMANOS ─────────
  {
    id: "humano", nombre: "Humano promedio", emoji: "🧍", categoria: "humano", medio: "tierra", nado: 0.4, hogar: [],
    peso: 75, largo: 1.72, velocidad: 24, mordida: 160,
    ataque: 15, defensa: 20, fuerza: 40, agilidad: 45, ferocidad: 40, resistencia: 85, inteligencia: 100,
    armas: "Puños... y mucha confianza",
    fortaleza: "La mayor resistencia del reino animal (corre durante horas) y el cerebro más grande.",
    debilidad: "Sin garras, sin colmillos, piel delgada.",
    dato: "Somos de los pocos animales que regulan temperatura sudando por todo el cuerpo.",
  },
  {
    id: "mma", nombre: "Peleador de MMA", emoji: "🥋", categoria: "humano", medio: "tierra", nado: 0.5, hogar: [],
    peso: 84, largo: 1.83, velocidad: 32, mordida: 160,
    ataque: 30, defensa: 30, fuerza: 55, agilidad: 65, ferocidad: 70, resistencia: 90, inteligencia: 100,
    armas: "Golpes, patadas, llaves y estrangulaciones",
    fortaleza: "Técnica entrenada y experiencia real de combate.",
    debilidad: "Las llaves no funcionan igual en un animal de 4 patas.",
    dato: "Un golpe profesional puede superar los 500 kg de fuerza.",
  },
  {
    id: "strongman", nombre: "Strongman", emoji: "🏋️", categoria: "humano", medio: "tierra", nado: 0.3, hogar: [],
    peso: 180, largo: 1.95, velocidad: 20, mordida: 160,
    ataque: 20, defensa: 40, fuerza: 50, agilidad: 30, ferocidad: 50, resistencia: 60, inteligencia: 100,
    armas: "Agarres y levantamientos de medio tonelada",
    fortaleza: "El humano más fuerte posible: levanta más de 500 kg.",
    debilidad: "Lento y sin armas naturales.",
    dato: "El récord de peso muerto supera los 500 kg.",
  },
  {
    id: "cazador", nombre: "Cazador con lanza", emoji: "🗡️", categoria: "humano", medio: "tierra", nado: 0.4, hogar: [],
    peso: 70, largo: 1.75, velocidad: 28, mordida: 160,
    ataque: 70, defensa: 25, fuerza: 45, agilidad: 55, ferocidad: 60, resistencia: 95, inteligencia: 100,
    armas: "Lanza de 2 m con punta de acero",
    fortaleza: "La herramienta que nos hizo cazar mamuts. Mantiene la distancia.",
    debilidad: "Si falla el primer golpe, está en problemas.",
    dato: "Los masái tradicionalmente cazaban leones con lanza.",
  },
];
