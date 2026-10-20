# Mokepon

Juego de batallas por turnos con mapa en canvas, hecho con HTML, CSS, JavaScript y
Express. Eliges un mokepón, lo paseas por el mapa y, cuando chocas con otro, empieza
el combate: cinco ataques por lado y tres vidas para cada uno.

Es el proyecto del [Curso de Programación Básica de Platzi](https://platzi.com/cursos/programacion-basica-2022/),
rehecho desde cero: el código, los estilos y los sprites de este repositorio son propios.

## Cómo jugar

**Opción rápida (un jugador).** Abre `public/index.html` con doble clic. No necesitas
instalar nada: peleas contra mokepones salvajes que controla el navegador.

**Con servidor (multijugador en tu red).**

```bash
npm install
npm start
```

Abre <http://localhost:8080>. Cada pestaña o dispositivo que entre es un jugador más:
verás a los demás moverse por el mapa y, si chocas con alguno, pelean entre ustedes de
verdad (los ataques viajan por el servidor). Para jugar desde el celular, entra a
`http://IP-DE-TU-PC:8080` estando en la misma red wifi.

Controles: flechas o `WASD` en el teclado, o los botones de la pantalla si estás en
el celular.

## Reglas

Los ataques funcionan como piedra, papel o tijera:

| Ataque | Le gana a |
| --- | --- |
| 💧 Agua | 🔥 Fuego |
| 🔥 Fuego | 🌱 Planta |
| 🌱 Planta | 💧 Agua |

- Cada mokepón tiene **5 ataques**: 3 de su propio elemento y 1 de cada uno de los otros dos.
- Cada uno empieza con **3 vidas**. Perder una ronda cuesta una vida.
- Se juegan hasta 5 rondas; el combate termina antes si alguien se queda sin vidas.
- Gana quien conserve más vidas. Si quedan iguales, es empate.

## Los seis mokepones

| Mokepón | Elemento | |
| --- | --- | --- |
| Hipodoge | 💧 Agua | Tranquilo hasta que lo mojas |
| Pydos | 💧 Agua | Nada más rápido de lo que piensas |
| Ratigueya | 🔥 Fuego | Rápida, ruidosa y con la cola en llamas |
| Langostelvis | 🔥 Fuego | Dos pinzas y un copete inolvidable |
| Capipepo | 🌱 Planta | Mitad capibara, mitad huerta |
| Tucapalma | 🌱 Planta | Pico grande, paciencia corta |

## Estructura

```
mokepon/
├── public/              Todo lo que corre en el navegador
│   ├── index.html       Las cuatro pantallas del juego (selección, mapa, combate, resultado)
│   ├── css/estilos.css
│   ├── js/datos.js      Elementos, reglas y catálogo de mokepones
│   ├── js/api.js        Cliente del servidor (y detección del modo local)
│   ├── js/juego.js      Selección, mapa en canvas y combate
│   └── assets/          Sprites y mapa en SVG
├── src/Jugador.js       Cada jugador conectado al servidor
├── server.js            Servidor Express del modo multijugador
└── package.json
```

El juego funciona sin servidor: si `public/js/api.js` no logra conectarse, el juego
cambia solo al modo local y genera mokepones salvajes.

## API del servidor

| Método | Ruta | Para qué |
| --- | --- | --- |
| `GET` | `/unirse` | Entra a la partida y devuelve tu `id` |
| `POST` | `/mokepon/:id` | Guarda con qué mokepón vas a jugar |
| `POST` | `/mokepon/:id/posicion` | Manda tu posición y devuelve la de los demás |
| `POST` | `/mokepon/:id/ataques` | Guarda tus 5 ataques del combate |
| `GET` | `/mokepon/:id/ataques` | Consulta los ataques de tu rival |

Los jugadores viven en memoria y se borran a los 30 segundos sin dar señales de vida.

## Publicarlo en la web

La carpeta `public/` es un sitio estático: súbela a GitHub Pages, Netlify o Vercel y
el juego queda jugable en modo local. El multijugador necesita un servidor Node
corriendo (Render, Railway, Fly.io o tu propia máquina).

## Licencia

MIT. Los sprites SVG y el código son originales de este repositorio; Platzi solo
inspiró la idea del proyecto.
