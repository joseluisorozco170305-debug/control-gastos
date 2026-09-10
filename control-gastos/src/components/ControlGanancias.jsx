import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

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

    if (periodo === 'mes') {
      query = query.gte('created_at', inicioMes().toISOString())
    }

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

  return (
    <div className="ganancias-card">
      <div className="section-header" style={{ marginBottom: 10 }}>
        <div className={`estado ${esPositivo ? 'positivo' : 'negativo'}`} style={{ marginBottom: 0 }}>
          {esPositivo ? '📈 Vas ganando' : '📉 Estás gastando más de lo que ganas'}
        </div>
        <div className="periodo-toggle">
          <div
            className={`periodo-option ${periodo === 'mes' ? 'active' : ''}`}
            onClick={() => setPeriodo('mes')}
          >
            Mes actual
          </div>
          <div
            className={`periodo-option ${periodo === 'total' ? 'active' : ''}`}
            onClick={() => setPeriodo('total')}
          >
            Total
          </div>
        </div>
      </div>

      <div className="ganancias-detalle">
        <div className="item">
          <div className="label">Ingresos</div>
          <div className="valor" style={{ color: 'var(--mint-dark)' }}>
            ${totales.ingresos.toFixed(2)}
          </div>
        </div>
        <div className="item">
          <div className="label">Gastos</div>
          <div className="valor" style={{ color: 'var(--coral-dark)' }}>
            ${totales.gastos.toFixed(2)}
          </div>
        </div>
        <div className="item">
          <div className="label">Ganancia neta</div>
          <div className="valor" style={{ color: esPositivo ? 'var(--mint-dark)' : 'var(--coral-dark)' }}>
            ${ganancia.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}