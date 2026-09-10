import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function inicioHoy() {
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

export default function ConciliacionPedidos({ negocioId, refrescar }) {
  const [periodo, setPeriodo] = useState('hoy')
  const [totalPedidos, setTotalPedidos] = useState(0)
  const [totalIngresos, setTotalIngresos] = useState(0)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (negocioId) calcular()
  }, [periodo, refrescar, negocioId])

  const calcular = async () => {
    setCargando(true)
    const desde = periodo === 'hoy' ? inicioHoy() : inicioSemana()

    const { data: pedidos } = await supabase
      .from('detalle_pedidos')
      .select('precio')
      .eq('negocio_id', negocioId)
      .gte('created_at', desde.toISOString())

    const { data: ingresos } = await supabase
      .from('movimientos')
      .select('monto')
      .eq('negocio_id', negocioId)
      .eq('tipo', 'ingreso')
      .gte('created_at', desde.toISOString())

    const sumaPedidos = (pedidos || []).reduce((acc, p) => acc + Number(p.precio), 0)
    const sumaIngresos = (ingresos || []).reduce((acc, m) => acc + Number(m.monto), 0)

    setTotalPedidos(sumaPedidos)
    setTotalIngresos(sumaIngresos)
    setCargando(false)
  }

  if (cargando) return null

  const diferencia = totalPedidos - totalIngresos
  const hayDesajuste = Math.abs(diferencia) > 1

  return (
    <div className="movements-section" style={{ marginTop: 20 }}>
      <div className="section-header">
        <h3>Conciliación de caja</h3>
        <div className="periodo-toggle">
          <div
            className={`periodo-option ${periodo === 'hoy' ? 'active' : ''}`}
            onClick={() => setPeriodo('hoy')}
          >
            Hoy
          </div>
          <div
            className={`periodo-option ${periodo === 'semana' ? 'active' : ''}`}
            onClick={() => setPeriodo('semana')}
          >
            Semana
          </div>
        </div>
      </div>

      <div className="ganancias-card" style={{ marginBottom: 0 }}>
        {hayDesajuste ? (
          <div className="estado negativo">
            ⚠️ Hay ${Math.abs(diferencia).toFixed(2)} sin cuadrar
          </div>
        ) : (
          <div className="estado positivo">✅ Todo cuadra</div>
        )}

        <div className="ganancias-detalle">
          <div className="item">
            <div className="label">Según comandas</div>
            <div className="valor" style={{ color: 'var(--lavender-dark)' }}>
              ${totalPedidos.toFixed(2)}
            </div>
          </div>
          <div className="item">
            <div className="label">Registrado como ingreso</div>
            <div className="valor" style={{ color: 'var(--mint-dark)' }}>
              ${totalIngresos.toFixed(2)}
            </div>
          </div>
          <div className="item">
            <div className="label">Diferencia</div>
            <div
              className="valor"
              style={{ color: hayDesajuste ? 'var(--coral-dark)' : 'var(--mint-dark)' }}
            >
              ${diferencia.toFixed(2)}
            </div>
          </div>
        </div>

        {hayDesajuste && (
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
            {diferencia > 0
              ? 'Se vendió más de lo que se registró como ingreso — probablemente alguien olvidó registrar un pago.'
              : 'Se registró más ingreso del que aparece en comandas — revisa si hay un ingreso duplicado o de otra fuente.'}
          </p>
        )}
      </div>
    </div>
  )
}