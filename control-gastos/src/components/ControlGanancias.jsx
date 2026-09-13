import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function inicioDia() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return hoy
}

function inicioSemana() {
  const hoy = new Date()
  const dia = hoy.getDay()
  const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1)
  const inicio = new Date(hoy.setDate(diff))
  inicio.setHours(0, 0, 0, 0)
  return inicio
}

function inicioMes() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
}

export default function ControlGanancias({ negocioId, refrescar }) {
  const [periodo, setPeriodo] = useState('mes')
  const [totales, setTotales] = useState({ ingresos: 0, gastos: 0 })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (negocioId) calcular()
  }, [negocioId, refrescar, periodo])

  const calcular = async () => {
    setCargando(true)

    let query = supabase
      .from('movimientos')
      .select('tipo, monto')
      .eq('negocio_id', negocioId)

    if (periodo === 'dia') query = query.gte('created_at', inicioDia().toISOString())
    if (periodo === 'semana') query = query.gte('created_at', inicioSemana().toISOString())
    if (periodo === 'mes') query = query.gte('created_at', inicioMes().toISOString())

    const { data, error } = await query

    if (error || !data) {
      setCargando(false)
      return
    }

    let ingresos = 0
    let gastos = 0

    data.forEach((m) => {
      if (m.tipo === 'ingreso') ingresos += Number(m.monto)
      else gastos += Number(m.monto)
    })

    setTotales({ ingresos, gastos })
    setCargando(false)
  }

  if (cargando) return null

  const ganancia = totales.ingresos - totales.gastos
  const esPositivo = ganancia >= 0

  const opciones = [
    { id: 'dia', label: 'Día' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'total', label: 'Total' },
  ]

  return (
    <div className="ganancias-card">
      <div className={`estado ${esPositivo ? 'positivo' : 'negativo'}`}>
        {esPositivo ? '📈 Vas ganando' : '📉 Estás gastando más de lo que ganas'}
      </div>

      <div className="periodo-toggle-wrap">
        {opciones.map((op) => (
          <div
            key={op.id}
            className={`periodo-option ${periodo === op.id ? 'active' : ''}`}
            onClick={() => setPeriodo(op.id)}
          >
            {op.label}
          </div>
        ))}
      </div>

      <div className="ganancias-detalle">
        <div className="item">
          <div className="label">📈 Ingresos</div>
          <div className="valor" style={{ color: 'var(--mint-dark)' }}>
            ${totales.ingresos.toFixed(2)}
          </div>
        </div>
        <div className="item">
          <div className="label">📉 Gastos</div>
          <div className="valor" style={{ color: 'var(--coral-dark)' }}>
            ${totales.gastos.toFixed(2)}
          </div>
        </div>
        <div className="item">
          <div className="label">✨ Neta</div>
          <div className="valor" style={{ color: esPositivo ? 'var(--mint-dark)' : 'var(--coral-dark)' }}>
            ${ganancia.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}