import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function inicioDelDia(fecha) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

function finDelDia(fecha) {
  const d = new Date(fecha)
  d.setHours(23, 59, 59, 999)
  return d
}

function esHoy(fecha) {
  const hoy = new Date()
  return fecha.toDateString() === hoy.toDateString()
}

const metodoInfo = {
  efectivo: { emoji: '💵', label: 'Efectivo', color: 'var(--mint)' },
  tarjeta: { emoji: '💳', label: 'Tarjeta', color: 'var(--lavender)' },
  transferencia: { emoji: '🏦', label: 'Transferencia', color: 'var(--sky)' },
}

export default function ListaMovimientos({ negocioId, refrescar, onCambio }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [movimientos, setMovimientos] = useState([])
  const [tipoVista, setTipoVista] = useState('ingreso')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarMovimientos()
  }, [refrescar, negocioId, fechaSeleccionada])

  const cargarMovimientos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .eq('negocio_id', negocioId)
      .gte('created_at', inicioDelDia(fechaSeleccionada).toISOString())
      .lte('created_at', finDelDia(fechaSeleccionada).toISOString())
      .order('created_at', { ascending: false })

    if (!error) setMovimientos(data)
    setCargando(false)
  }

  const cambiarDia = (delta) => {
    const nueva = new Date(fechaSeleccionada)
    nueva.setDate(nueva.getDate() + delta)
    setFechaSeleccionada(nueva)
  }

  const borrar = async (id) => {
    if (!confirm('¿Borrar este movimiento? Esta acción no se puede deshacer.')) return

    await supabase.from('movimientos').delete().eq('id', id)
    setMovimientos(movimientos.filter((m) => m.id !== id))
    if (onCambio) onCambio()
  }

  const renderItem = (m) => {
    const info = metodoInfo[m.metodo_pago] || metodoInfo.efectivo
    return (
      <div key={m.id} className="movement-item" style={{ borderLeftColor: info.color }}>
        <div>
          <div className="movement-tipo" style={{ color: m.tipo === 'ingreso' ? 'var(--mint-dark)' : 'var(--coral-dark)' }}>
            {m.tipo === 'ingreso' ? '💚' : '❤️'} {m.descripcion || 'Sin descripción'}
          </div>
          <span className={`metodo-tag ${m.metodo_pago}`}>
            {info.emoji} {info.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="movement-amount">${Number(m.monto).toFixed(2)}</div>
          <button className="btn-borrar" onClick={() => borrar(m.id)}>✕</button>
        </div>
      </div>
    )
  }

  const filtrados = movimientos.filter((m) => m.tipo === tipoVista)

  const etiquetaFecha = esHoy(fechaSeleccionada)
    ? 'Hoy'
    : fechaSeleccionada.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })

  return (
    <div className="movements-section">
      <h3>💸 Movimientos</h3>

      <div className="date-nav">
        <button onClick={() => cambiarDia(-1)}>◀</button>
        <div className="fecha-label">{etiquetaFecha}</div>
        <button onClick={() => cambiarDia(1)} disabled={esHoy(fechaSeleccionada)}>▶</button>
        {!esHoy(fechaSeleccionada) && (
          <button className="btn-hoy" onClick={() => setFechaSeleccionada(new Date())}>Hoy</button>
        )}
      </div>

      <div className="tipo-toggle">
        <div
          className={`tipo-option ingreso ${tipoVista === 'ingreso' ? 'active' : ''}`}
          onClick={() => setTipoVista('ingreso')}
        >
          💚 Ingresos
        </div>
        <div
          className={`tipo-option gasto ${tipoVista === 'gasto' ? 'active' : ''}`}
          onClick={() => setTipoVista('gasto')}
        >
          ❤️ Gastos
        </div>
      </div>

      {cargando ? (
        <p style={{ color: '#9891A3' }}>Cargando...</p>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">
          {tipoVista === 'ingreso' ? '📭 Sin ingresos ese día.' : '📭 Sin gastos ese día.'}
        </div>
      ) : (
        filtrados.map(renderItem)
      )}
    </div>
  )
}