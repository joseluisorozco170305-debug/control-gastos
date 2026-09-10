import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ListaMovimientos({ negocioId, refrescar }) {
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarMovimientos()
  }, [refrescar, negocioId])

  const cargarMovimientos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('created_at', { ascending: false })

    if (!error) setMovimientos(data)
    setCargando(false)
  }

  if (cargando) return <p style={{ color: '#9891A3' }}>Cargando movimientos...</p>

  return (
    <div className="movements-section">
      <h3>Movimientos</h3>
      {movimientos.length === 0 ? (
        <div className="empty-state">Todavía no hay movimientos registrados.</div>
      ) : (
        movimientos.map((m) => (
          <div key={m.id} className={`movement-item ${m.tipo}`}>
            <div>
              <div className="movement-tipo">
                {m.tipo === 'ingreso' ? '+ Ingreso' : '- Gasto'}
              </div>
              <div className="movement-meta">
                {m.descripcion || 'Sin descripción'} · {m.metodo_pago}
              </div>
            </div>
            <div>
              <div className="movement-amount">${Number(m.monto).toFixed(2)}</div>
              <div className="movement-date">
                {new Date(m.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}