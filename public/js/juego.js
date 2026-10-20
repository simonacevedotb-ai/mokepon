/**
 * Lógica del juego: selección de mokepón, mapa en canvas y combate por turnos.
 */

const MAPA_ANCHO = 500
const MAPA_ALTO = 500
const VELOCIDAD = 4
const CUADROS_POR_SEGUNDO = 50
const ENEMIGOS_LOCALES = 3
const MS_ENTRE_RONDAS = 900
const MS_ESPERA_RIVAL = 20000

// --- Estado de la partida ---
let mokeponJugador = null
let mokeponEnemigo = null
let idEnemigo = null
let ataquesJugador = []
let ataquesEnemigo = []
let vidasJugador = VIDAS_INICIALES
let vidasEnemigo = VIDAS_INICIALES
let enCombate = false

// --- Estado del mapa ---
let lienzo = null
let intervaloMapa = null
let intervaloPosicion = null
let enemigosEnMapa = []
const enemigosPorId = new Map()
const imagenMapa = new Image()
imagenMapa.src = 'assets/mapa.svg'

// --- Elementos del DOM ---
const d = {}

window.addEventListener('load', iniciarJuego)

function iniciarJuego() {
  d.seccionMascota = document.getElementById('seleccionar-mascota')
  d.seccionMapa = document.getElementById('ver-mapa')
  d.seccionAtaque = document.getElementById('seleccionar-ataque')
  d.seccionReinicio = document.getElementById('reiniciar')
  d.tarjetas = document.getElementById('tarjetas-mokepones')
  d.botonMascota = document.getElementById('boton-mascota')
  d.estadoConexion = document.getElementById('estado-conexion')
  d.mapa = document.getElementById('mapa')
  d.botonesAtaque = document.getElementById('botones-ataque')
  d.secuencia = document.getElementById('secuencia-jugador')
  d.bitacora = document.getElementById('bitacora')
  d.resultado = document.getElementById('resultado')
  d.resumen = document.getElementById('resumen')
  d.botonReiniciar = document.getElementById('boton-reiniciar')
  d.fotoJugador = document.getElementById('foto-jugador')
  d.fotoEnemigo = document.getElementById('foto-enemigo')
  d.nombreJugador = document.getElementById('nombre-jugador')
  d.nombreEnemigo = document.getElementById('nombre-enemigo')
  d.vidasJugador = document.getElementById('vidas-jugador')
  d.vidasEnemigo = document.getElementById('vidas-enemigo')

  pintarTarjetas()
  escucharControles()

  d.botonMascota.addEventListener('click', seleccionarMokepon)
  d.botonReiniciar.addEventListener('click', () => location.reload())

  conectar()
}

async function conectar() {
  await api.unirse()
  if (api.disponible) {
    d.estadoConexion.textContent = 'Multijugador: vas a ver a los demás jugadores en el mapa.'
    d.estadoConexion.classList.add('estado--conectado')
  } else {
    d.estadoConexion.textContent = 'Modo local: peleas contra mokepones salvajes.'
    d.estadoConexion.classList.remove('estado--conectado')
  }
}

// ---------------------------------------------------------------- Selección

function pintarTarjetas() {
  MOKEPONES.forEach((mokepon) => {
    const tarjeta = document.createElement('div')
    tarjeta.className = 'tarjeta'
    tarjeta.innerHTML = `
      <input type="radio" name="mascota" id="${mokepon.id}" value="${mokepon.id}" class="tarjeta__input">
      <label for="${mokepon.id}" class="tarjeta__cuerpo">
        <img src="${mokepon.foto}" alt="${mokepon.nombre}" class="tarjeta__foto">
        <p class="tarjeta__nombre">${mokepon.nombre}</p>
        <p class="tarjeta__elemento elemento--${mokepon.elemento}">
          ${mokepon.elementoInfo.emoji} ${mokepon.elementoInfo.nombre}
        </p>
        <p class="tarjeta__descripcion">${mokepon.descripcion}</p>
      </label>
    `
    d.tarjetas.appendChild(tarjeta)
  })

  d.tarjetas.addEventListener('change', () => {
    d.botonMascota.disabled = !d.tarjetas.querySelector('input:checked')
  })
}

function seleccionarMokepon() {
  const elegido = d.tarjetas.querySelector('input:checked')
  if (!elegido) return

  mokeponJugador = obtenerMokepon(elegido.value).clonar()
  api.elegirMokepon(mokeponJugador.nombre)

  mostrarSeccion(d.seccionMapa)
  iniciarMapa()
}

function mostrarSeccion(seccion) {
  ;[d.seccionMascota, d.seccionMapa, d.seccionAtaque, d.seccionReinicio].forEach((s) => {
    s.classList.toggle('oculto', s !== seccion)
  })
}

// ---------------------------------------------------------------- Mapa

function iniciarMapa() {
  lienzo = d.mapa.getContext('2d')
  // Posición de salida al azar para que dos jugadores no aparezcan encima del otro.
  mokeponJugador.colocarEn(
    numeroAlAzar(20, MAPA_ANCHO - mokeponJugador.ancho - 20),
    numeroAlAzar(MAPA_ALTO - 180, MAPA_ALTO - mokeponJugador.alto - 20)
  )

  if (api.disponible) {
    intervaloPosicion = setInterval(sincronizarPosicion, 100)
  } else {
    crearEnemigosLocales()
  }

  intervaloMapa = setInterval(pintarCanvas, 1000 / CUADROS_POR_SEGUNDO)
}

function detenerMapa() {
  clearInterval(intervaloMapa)
  clearInterval(intervaloPosicion)
  intervaloMapa = null
  intervaloPosicion = null
  mokeponJugador.velocidadX = 0
  mokeponJugador.velocidadY = 0
}

function crearEnemigosLocales() {
  enemigosEnMapa = []
  const disponibles = MOKEPONES.filter((mokepon) => mokepon.id !== mokeponJugador.id)

  while (enemigosEnMapa.length < ENEMIGOS_LOCALES && enemigosEnMapa.length < disponibles.length) {
    const candidato = elementoAlAzar(disponibles)
    const repetido = enemigosEnMapa.some((enemigo) => enemigo.id === candidato.id)
    if (repetido) continue

    enemigosEnMapa.push(
      candidato.clonar().colocarEn(
        numeroAlAzar(20, MAPA_ANCHO - 84),
        numeroAlAzar(20, MAPA_ALTO - 240)
      )
    )
  }
}

async function sincronizarPosicion() {
  const enemigos = await api.actualizarPosicion(mokeponJugador.x, mokeponJugador.y)
  enemigosEnMapa = enemigos.map((enemigo) => {
    let instancia = enemigosPorId.get(enemigo.id)
    if (!instancia || instancia.nombre !== enemigo.mokepon) {
      const plantilla = obtenerMokeponPorNombre(enemigo.mokepon)
      if (!plantilla) return null
      instancia = plantilla.clonar()
      instancia.idJugador = enemigo.id
      enemigosPorId.set(enemigo.id, instancia)
    }
    instancia.colocarEn(enemigo.x, enemigo.y)
    return instancia
  }).filter(Boolean)
}

function pintarCanvas() {
  moverJugador()

  lienzo.clearRect(0, 0, MAPA_ANCHO, MAPA_ALTO)
  lienzo.drawImage(imagenMapa, 0, 0, MAPA_ANCHO, MAPA_ALTO)

  mokeponJugador.pintar(lienzo)
  enemigosEnMapa.forEach((enemigo) => enemigo.pintar(lienzo))

  revisarColisiones()
}

function moverJugador() {
  mokeponJugador.x += mokeponJugador.velocidadX
  mokeponJugador.y += mokeponJugador.velocidadY

  mokeponJugador.x = Math.min(Math.max(mokeponJugador.x, 0), MAPA_ANCHO - mokeponJugador.ancho)
  mokeponJugador.y = Math.min(Math.max(mokeponJugador.y, 0), MAPA_ALTO - mokeponJugador.alto)
}

function revisarColisiones() {
  if (enCombate) return

  const rival = enemigosEnMapa.find((enemigo) => mokeponJugador.colisionaCon(enemigo))
  if (rival) iniciarCombate(rival)
}

// ---------------------------------------------------------------- Controles

function escucharControles() {
  window.addEventListener('keydown', (evento) => {
    const direccion = direccionDeTecla(evento.key)
    if (!direccion || !intervaloMapa) return
    evento.preventDefault()
    // El navegador repite la tecla mientras está presionada: la velocidad ya quedó puesta.
    if (!evento.repeat) mover(direccion)
  })

  window.addEventListener('keyup', (evento) => {
    if (direccionDeTecla(evento.key)) detener()
  })

  document.querySelectorAll('.dpad__boton').forEach((boton) => {
    boton.addEventListener('pointerdown', () => mover(boton.dataset.direccion))
    boton.addEventListener('pointerup', detener)
    boton.addEventListener('pointerleave', detener)
    boton.addEventListener('pointercancel', detener)
  })
}

function direccionDeTecla(tecla) {
  const teclas = {
    ArrowUp: 'arriba',
    ArrowDown: 'abajo',
    ArrowLeft: 'izquierda',
    ArrowRight: 'derecha',
    w: 'arriba',
    s: 'abajo',
    a: 'izquierda',
    d: 'derecha',
    W: 'arriba',
    S: 'abajo',
    A: 'izquierda',
    D: 'derecha',
  }
  return teclas[tecla]
}

function mover(direccion) {
  if (!mokeponJugador || enCombate) return
  detener()
  if (direccion === 'arriba') mokeponJugador.velocidadY = -VELOCIDAD
  if (direccion === 'abajo') mokeponJugador.velocidadY = VELOCIDAD
  if (direccion === 'izquierda') mokeponJugador.velocidadX = -VELOCIDAD
  if (direccion === 'derecha') mokeponJugador.velocidadX = VELOCIDAD
  // Un toque corto también debe moverlo, sin esperar al siguiente cuadro.
  if (intervaloMapa) moverJugador()
}

function detener() {
  if (!mokeponJugador) return
  mokeponJugador.velocidadX = 0
  mokeponJugador.velocidadY = 0
}

// ---------------------------------------------------------------- Combate

function iniciarCombate(rival) {
  enCombate = true
  mokeponEnemigo = rival
  idEnemigo = rival.idJugador || null
  ataquesJugador = []
  ataquesEnemigo = []
  vidasJugador = VIDAS_INICIALES
  vidasEnemigo = VIDAS_INICIALES

  detenerMapa()
  mostrarSeccion(d.seccionAtaque)

  d.fotoJugador.src = mokeponJugador.foto
  d.fotoJugador.alt = mokeponJugador.nombre
  d.nombreJugador.textContent = mokeponJugador.nombre
  d.fotoEnemigo.src = mokeponEnemigo.foto
  d.fotoEnemigo.alt = mokeponEnemigo.nombre
  d.nombreEnemigo.textContent = mokeponEnemigo.nombre

  d.bitacora.innerHTML = ''
  d.secuencia.textContent = ''
  pintarVidas()
  pintarBotonesDeAtaque()
}

function pintarVidas() {
  d.vidasJugador.textContent = corazones(vidasJugador)
  d.vidasEnemigo.textContent = corazones(vidasEnemigo)
}

function corazones(vidas) {
  return '❤️'.repeat(vidas) + '🖤'.repeat(VIDAS_INICIALES - vidas)
}

function pintarBotonesDeAtaque() {
  d.botonesAtaque.innerHTML = ''

  mokeponJugador.ataques.forEach((elemento, indice) => {
    const info = ELEMENTOS[elemento]
    const boton = document.createElement('button')
    boton.className = `ataque ataque--${elemento}`
    boton.dataset.elemento = elemento
    boton.dataset.indice = indice
    boton.innerHTML = `<span class="ataque__emoji">${info.emoji}</span><span>${info.nombre}</span>`
    boton.addEventListener('click', () => elegirAtaque(elemento, boton))
    d.botonesAtaque.appendChild(boton)
  })
}

function elegirAtaque(elemento, boton) {
  ataquesJugador.push(elemento)
  boton.disabled = true
  d.secuencia.textContent = ataquesJugador.map((ataque) => ELEMENTOS[ataque].emoji).join('')

  if (ataquesJugador.length === ATAQUES_POR_COMBATE) {
    bloquearBotonesDeAtaque()
    prepararAtaquesDelEnemigo()
  }
}

function bloquearBotonesDeAtaque() {
  d.botonesAtaque.querySelectorAll('button').forEach((boton) => {
    boton.disabled = true
  })
}

async function prepararAtaquesDelEnemigo() {
  if (api.disponible && idEnemigo) {
    await api.enviarAtaques(ataquesJugador)
    mostrarAviso('Esperando los ataques de tu rival…')
    ataquesEnemigo = await esperarAtaquesDelRival()
    d.bitacora.innerHTML = ''
  }

  if (ataquesEnemigo.length < ATAQUES_POR_COMBATE) {
    ataquesEnemigo = ataquesAlAzar(mokeponEnemigo)
  }

  resolverCombate()
}

function ataquesAlAzar(mokepon) {
  return Array.from({ length: ATAQUES_POR_COMBATE }, () => elementoAlAzar(mokepon.ataques))
}

async function esperarAtaquesDelRival() {
  const limite = Date.now() + MS_ESPERA_RIVAL

  while (Date.now() < limite) {
    const ataques = await api.obtenerAtaques(idEnemigo)
    if (ataques.length >= ATAQUES_POR_COMBATE) return ataques.slice(0, ATAQUES_POR_COMBATE)
    await esperar(1000)
  }

  return []
}

async function resolverCombate() {
  for (let ronda = 0; ronda < ATAQUES_POR_COMBATE; ronda++) {
    await esperar(MS_ENTRE_RONDAS)

    const ataqueJugador = ataquesJugador[ronda]
    const ataqueEnemigo = ataquesEnemigo[ronda]
    const resultado = compararAtaques(ataqueJugador, ataqueEnemigo)

    if (resultado === 'jugador') vidasEnemigo--
    if (resultado === 'enemigo') vidasJugador--

    pintarVidas()
    pintarRonda(ronda + 1, ataqueJugador, ataqueEnemigo, resultado)

    if (vidasJugador === 0 || vidasEnemigo === 0) break
  }

  await esperar(MS_ENTRE_RONDAS)
  terminarCombate()
}

function pintarRonda(numero, ataqueJugador, ataqueEnemigo, resultado) {
  const textos = {
    jugador: '¡Ganaste la ronda!',
    enemigo: 'Perdiste la ronda',
    empate: 'Empate',
  }

  const ronda = document.createElement('li')
  ronda.className = `bitacora__ronda bitacora__ronda--${
    resultado === 'jugador' ? 'ganada' : resultado === 'enemigo' ? 'perdida' : 'empate'
  }`
  ronda.innerHTML = `
    <span>Ronda ${numero}</span>
    <span class="bitacora__golpes">${ELEMENTOS[ataqueJugador].emoji} vs ${ELEMENTOS[ataqueEnemigo].emoji}</span>
    <span>${textos[resultado]}</span>
  `
  d.bitacora.appendChild(ronda)
}

function mostrarAviso(texto) {
  const aviso = document.createElement('li')
  aviso.className = 'bitacora__ronda bitacora__ronda--empate'
  aviso.textContent = texto
  d.bitacora.appendChild(aviso)
}

function terminarCombate() {
  // La bitácora viaja a la pantalla final para poder repasar el combate.
  d.seccionReinicio.insertBefore(d.bitacora, d.botonReiniciar)
  mostrarSeccion(d.seccionReinicio)

  if (vidasJugador > vidasEnemigo) {
    d.resultado.textContent = '¡Ganaste!'
    d.resultado.className = 'resultado resultado--ganaste'
  } else if (vidasJugador < vidasEnemigo) {
    d.resultado.textContent = 'Perdiste'
    d.resultado.className = 'resultado resultado--perdiste'
  } else {
    d.resultado.textContent = 'Empate'
    d.resultado.className = 'resultado resultado--empate'
  }

  d.resumen.textContent =
    `${mokeponJugador.nombre} ${corazones(vidasJugador)} — ` +
    `${mokeponEnemigo.nombre} ${corazones(vidasEnemigo)}`
}

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}
