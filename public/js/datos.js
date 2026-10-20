/**
 * Datos del juego: elementos, reglas y catálogo de mokepones.
 * Este archivo no toca el DOM, solo define qué existe en el juego.
 */

const VIDAS_INICIALES = 3
const ATAQUES_POR_COMBATE = 5

const ELEMENTOS = {
  agua: { id: 'agua', nombre: 'Agua', emoji: '💧' },
  fuego: { id: 'fuego', nombre: 'Fuego', emoji: '🔥' },
  planta: { id: 'planta', nombre: 'Planta', emoji: '🌱' },
}

/** Piedra, papel o tijera: el agua apaga el fuego, el fuego quema la planta, la planta bebe el agua. */
const LE_GANA_A = {
  agua: 'fuego',
  fuego: 'planta',
  planta: 'agua',
}

/**
 * Cada mokepón tiene 5 ataques: 3 de su propio elemento y 1 de cada uno
 * de los otros dos, en el orden que diga `secundarios`.
 */
function construirAtaques(elemento, secundarios) {
  return [elemento, elemento, elemento, ...secundarios]
}

class Mokepon {
  constructor(definicion) {
    this.definicion = definicion
    this.id = definicion.id
    this.nombre = definicion.nombre
    this.elemento = definicion.elemento
    this.descripcion = definicion.descripcion
    this.foto = `assets/${definicion.id}.svg`
    this.ataques = construirAtaques(definicion.elemento, definicion.secundarios)
    this.vidas = VIDAS_INICIALES

    // Estado en el mapa (canvas)
    this.ancho = 64
    this.alto = 64
    this.x = 0
    this.y = 0
    this.velocidadX = 0
    this.velocidadY = 0
    this.imagen = new Image()
    this.imagen.src = this.foto
  }

  get elementoInfo() {
    return ELEMENTOS[this.elemento]
  }

  /** Copia limpia del mokepón, para que una partida no herede el estado de la anterior. */
  clonar() {
    return new Mokepon(this.definicion)
  }

  pintar(lienzo) {
    lienzo.drawImage(this.imagen, this.x, this.y, this.ancho, this.alto)
  }

  colocarEn(x, y) {
    this.x = x
    this.y = y
    return this
  }

  /** Colisión de caja contra caja (AABB). */
  colisionaCon(otro) {
    return (
      this.x < otro.x + otro.ancho &&
      this.x + this.ancho > otro.x &&
      this.y < otro.y + otro.alto &&
      this.y + this.alto > otro.y
    )
  }
}

const MOKEPONES = [
  new Mokepon({
    id: 'hipodoge',
    nombre: 'Hipodoge',
    elemento: 'agua',
    descripcion: 'Tranquilo hasta que lo mojas',
    secundarios: ['fuego', 'planta'],
  }),
  new Mokepon({
    id: 'capipepo',
    nombre: 'Capipepo',
    elemento: 'planta',
    descripcion: 'Mitad capibara, mitad huerta',
    secundarios: ['fuego', 'agua'],
  }),
  new Mokepon({
    id: 'ratigueya',
    nombre: 'Ratigueya',
    elemento: 'fuego',
    descripcion: 'Rápida, ruidosa y con la cola en llamas',
    secundarios: ['agua', 'planta'],
  }),
  new Mokepon({
    id: 'tucapalma',
    nombre: 'Tucapalma',
    elemento: 'planta',
    descripcion: 'Pico grande, paciencia corta',
    secundarios: ['agua', 'fuego'],
  }),
  new Mokepon({
    id: 'pydos',
    nombre: 'Pydos',
    elemento: 'agua',
    descripcion: 'Nada más rápido de lo que piensas',
    secundarios: ['planta', 'fuego'],
  }),
  new Mokepon({
    id: 'langostelvis',
    nombre: 'Langostelvis',
    elemento: 'fuego',
    descripcion: 'Dos pinzas y un copete inolvidable',
    secundarios: ['planta', 'agua'],
  }),
]

function obtenerMokepon(id) {
  return MOKEPONES.find((mokepon) => mokepon.id === id)
}

function obtenerMokeponPorNombre(nombre) {
  return MOKEPONES.find((mokepon) => mokepon.nombre === nombre)
}

function numeroAlAzar(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function elementoAlAzar(lista) {
  return lista[numeroAlAzar(0, lista.length - 1)]
}

function mokeponAlAzar() {
  return elementoAlAzar(MOKEPONES).clonar()
}

/** Quién gana la ronda: 'jugador', 'enemigo' o 'empate'. */
function compararAtaques(ataqueJugador, ataqueEnemigo) {
  if (ataqueJugador === ataqueEnemigo) return 'empate'
  if (LE_GANA_A[ataqueJugador] === ataqueEnemigo) return 'jugador'
  return 'enemigo'
}
