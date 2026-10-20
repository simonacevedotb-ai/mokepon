/**
 * Servidor del modo multijugador.
 * Guarda en memoria quién está jugando, dónde está cada mokepón en el mapa
 * y los ataques que eligió cada jugador para su combate.
 */

const path = require('path')
const express = require('express')
const Jugador = require('./src/Jugador')

const app = express()
const PUERTO = process.env.PORT || 8080
const MS_INACTIVIDAD = 30000

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

/** @type {Jugador[]} */
let jugadores = []

app.get('/unirse', (peticion, respuesta) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  jugadores.push(new Jugador(id))
  console.log(`Se unió el jugador ${id} (${jugadores.length} en total)`)
  respuesta.json({ id })
})

app.post('/mokepon/:jugadorId', (peticion, respuesta) => {
  const jugador = buscarJugador(peticion.params.jugadorId)
  if (!jugador) return respuesta.status(404).json({ error: 'Jugador no encontrado' })

  if (!jugador.asignarMokepon(peticion.body.mokepon)) {
    return respuesta.status(400).json({ error: 'Falta el nombre del mokepón' })
  }

  respuesta.json({ ok: true })
})

app.post('/mokepon/:jugadorId/posicion', (peticion, respuesta) => {
  const jugador = buscarJugador(peticion.params.jugadorId)
  if (!jugador) return respuesta.status(404).json({ error: 'Jugador no encontrado' })

  jugador.actualizarPosicion(peticion.body.x, peticion.body.y)
  limpiarJugadoresInactivos()

  const enemigos = jugadores
    .filter((otro) => otro.id !== jugador.id && otro.estaEnElMapa())
    .map((otro) => otro.aJSON())

  respuesta.json({ enemigos })
})

app.post('/mokepon/:jugadorId/ataques', (peticion, respuesta) => {
  const jugador = buscarJugador(peticion.params.jugadorId)
  if (!jugador) return respuesta.status(404).json({ error: 'Jugador no encontrado' })

  if (!jugador.guardarAtaques(peticion.body.ataques)) {
    return respuesta.status(400).json({ error: 'Los ataques deben venir en una lista' })
  }

  respuesta.json({ ok: true })
})

app.get('/mokepon/:jugadorId/ataques', (peticion, respuesta) => {
  const jugador = buscarJugador(peticion.params.jugadorId)
  if (!jugador) return respuesta.status(404).json({ error: 'Jugador no encontrado' })

  respuesta.json({ ataques: jugador.ataques })
})

function buscarJugador(id) {
  return jugadores.find((jugador) => jugador.id === id)
}

function limpiarJugadoresInactivos() {
  jugadores = jugadores.filter((jugador) => !jugador.estaInactivo(MS_INACTIVIDAD))
}

app.listen(PUERTO, () => {
  console.log(`Mokepon escuchando en http://localhost:${PUERTO}`)
})
