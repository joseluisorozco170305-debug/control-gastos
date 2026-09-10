import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

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

export default function ProductosPopulares({ negocioId, refrescar }) {
  const [periodo, setPeriodo] = useState('semana')
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (negocioId) cargarPopulares()
  }, [periodo, refrescar, negocioId])

  const cargarPopulares = async () => {
    setCargando(true)
    const desde = periodo === 'semana' ? inicioSemana() : inicioMes()

    const { data, error } = await supabase
      .from('detalle_pedidos')
      .select('producto_nombre, cantidad')
      .eq('negocio_id', negocioId)
      .gte('created_at', desde.toISOString())

    if (error || !data) {
      setCargando(false)
      return
    }

    const conteo = {}
    data.forEach((d) => {
      conteo[d.producto_nombre] = (conteo[d.producto_nombre] || 0) + d.cantidad
    })

    const lista = Object.entries(conteo)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)

    setProductos(lista)
    setCargando(false)
  }

  return (
    <div className="movements-section" style={{ marginTop: 20 }}>
      <div className="section-header">
        <h3>Productos populares</h3>
        <div className="periodo-toggle">
          <div
            className={`periodo-option ${periodo === 'semana' ? 'active' : ''}`}
            onClick={() => setPeriodo('semana')}
          >
            Semana
          </div>
          <div
            className={`periodo-option ${periodo === 'mes' ? 'active' : ''}`}
            onClick={() => setPeriodo('mes')}
          >
            Mes
          </div>
        </div>
      </div>

      {cargando ? (
        <p style={{ color: '#9891A3' }}>Calculando...</p>
      ) : productos.length === 0 ? (
        <div className="empty-state">No hay pedidos registrados en este periodo.</div>
      ) : (
        productos.map((p, i) => (
          <div
            key={p.nombre}
            className="movement-item"
            style={{ borderLeftColor: i === 0 ? '#C7B8EA' : '#F0E6DC' }}
          >
            <div className="movement-tipo" style={{ color: '#3D3550' }}>
              {i + 1}. {p.nombre}
            </div>
            <div className="movement-amount">{p.total} pedidos</div>
          </div>
        ))
      )}
    </div>
  )
}