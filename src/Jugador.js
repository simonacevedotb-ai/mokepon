const ELEMENTOS_VALIDOS = ['agua', 'fuego', 'planta']
const ATAQUES_POR_COMBATE = 5
const MAPA = 500
const TAMANO_MOKEPON = 64

class Jugador {
  constructor(id) {
    this.id = id
    this.mokepon = null
    this.x = 0
    this.y = 0
    this.ataques = []
    this.ultimoContacto = Date.now()
  }

  asignarMokepon(nombre) {
    if (typeof nombre !== 'string' || !nombre.trim()) return false
    this.mokepon = nombre.trim().slice(0, 30)
    this.saludar()
    return true
  }

  actualizarPosicion(x, y) {
    this.x = limitar(x)
    this.y = limitar(y)
    this.saludar()
  }

  guardarAtaques(ataques) {
    if (!Array.isArray(ataques)) return false
    this.ataques = ataques
      .filter((ataque) => ELEMENTOS_VALIDOS.includes(ataque))
      .slice(0, ATAQUES_POR_COMBATE)
    this.saludar()
    return true
  }

  saludar() {
    this.ultimoContacto = Date.now()
  }

  estaEnElMapa() {
    return this.mokepon !== null
  }

  estaInactivo(ms) {
    return Date.now() - this.ultimoContacto > ms
  }

  /** Lo único que necesitan conocer los demás jugadores. */
  aJSON() {
    return { id: this.id, mokepon: this.mokepon, x: this.x, y: this.y }
  }
}

function limitar(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 0
  return Math.min(Math.max(Math.round(numero), 0), MAPA - TAMANO_MOKEPON)
}

module.exports = Jugador
