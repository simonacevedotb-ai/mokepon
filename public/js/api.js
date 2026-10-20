/**
 * Cliente del servidor multijugador (server.js).
 * Si el servidor no responde —por ejemplo al abrir index.html con doble clic—
 * el juego sigue funcionando contra mokepones salvajes controlados por el navegador.
 */

const api = {
  jugadorId: null,
  disponible: false,

  async unirse() {
    try {
      const respuesta = await fetch('unirse')
      if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`)
      const datos = await respuesta.json()
      this.jugadorId = datos.id
      this.disponible = true
      return datos.id
    } catch (error) {
      this.disponible = false
      return null
    }
  },

  async elegirMokepon(nombre) {
    if (!this.disponible) return
    await this.enviar(`mokepon/${this.jugadorId}`, { mokepon: nombre })
  },

  /** Manda la posición del jugador y devuelve la de los demás. */
  async actualizarPosicion(x, y) {
    if (!this.disponible) return []
    const datos = await this.enviar(`mokepon/${this.jugadorId}/posicion`, { x, y })
    return datos ? datos.enemigos : []
  },

  async enviarAtaques(ataques) {
    if (!this.disponible) return
    await this.enviar(`mokepon/${this.jugadorId}/ataques`, { ataques })
  },

  async obtenerAtaques(enemigoId) {
    if (!this.disponible) return []
    try {
      const respuesta = await fetch(`mokepon/${enemigoId}/ataques`)
      if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`)
      const datos = await respuesta.json()
      return datos.ataques || []
    } catch (error) {
      return []
    }
  },

  async enviar(ruta, cuerpo) {
    try {
      const respuesta = await fetch(ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`)
      return await respuesta.json()
    } catch (error) {
      this.disponible = false
      return null
    }
  },
}
