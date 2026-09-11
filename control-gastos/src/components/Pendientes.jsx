import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Pendientes({ negocioId }) {
  const [items, setItems] = useState([])
  const [texto, setTexto] = useState('')
  const [duracion, setDuracion] = useState('permanente')

  useEffect(() => {
    if (negocioId) cargar()
  }, [negocioId])

  const cargar = async () => {
    // Borra los temporales ya vencidos
    await supabase
      .from('pendientes')
      .delete()
      .eq('negocio_id', negocioId)
      .lt('expira_at', new Date().toISOString())

    // Reinicia los permanentes que fueron completados en un día anterior
    await supabase
      .from('pendientes')
      .update({ completado: false, completado_fecha: null })
      .eq('negocio_id', negocioId)
      .eq('tipo_duracion', 'permanente')
      .eq('completado', true)
      .lt('completado_fecha', hoyISO())

    const { data } = await supabase
      .from('pendientes')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('created_at', { ascending: false })

    if (data) setItems(data)
  }

  const agregar = async () => {
    if (!texto.trim()) return

    let expiraAt = null
    if (duracion === '24h') {
      expiraAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } else if (duracion === '48h') {
      expiraAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    }

    const { data } = await supabase
      .from('pendientes')
      .insert({
        texto: texto.trim(),
        tipo_duracion: duracion,
        expira_at: expiraAt,
        negocio_id: negocioId,
        completado: false,
      })
      .select()
      .single()

    if (data) setItems([data, ...items])
    setTexto('')
  }

  const toggleCompletado = async (item) => {
    const nuevoEstado = !item.completado
    await supabase
      .from('pendientes')
      .update({
        completado: nuevoEstado,
        completado_fecha: nuevoEstado ? hoyISO() : null,
      })
      .eq('id', item.id)

    setItems(
      items.map((i) =>
        i.id === item.id ? { ...i, completado: nuevoEstado } : i
      )
    )
  }

  const borrar = async (id) => {
    await supabase.from('pendientes').delete().eq('id', id)
    setItems(items.filter((i) => i.id !== id))
  }

  const etiqueta = (item) => {
    if (item.tipo_duracion === 'permanente') return { texto: 'Diario', clase: 'permanente' }
    if (item.tipo_duracion === '24h') return { texto: '24 horas', clase: 'temporal' }
    return { texto: '48 horas', clase: 'temporal' }
  }

  return (
    <div className="movements-section" style={{ marginTop: 20 }}>
      <h3>📌 Pendientes</h3>

      <div className="input-agregar">
        <input
          type="text"
          placeholder="Ej. Llamar al proveedor..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && agregar()}
          className="form-field"
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className="input-agregar">
        <select
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          className="form-field"
          style={{ marginBottom: 0, flex: 1 }}
        >
          <option value="permanente">Permanente (diario)</option>
          <option value="24h">24 horas</option>
          <option value="48h">48 horas</option>
        </select>
        <button className="btn-icono" onClick={agregar}>+</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">No hay pendientes 🎉</div>
      ) : (
        items.map((item) => {
          const etq = etiqueta(item)
          const esTachable = item.tipo_duracion === 'permanente'
          return (
            <div key={item.id} className={`item-lista ${item.completado ? 'tachado' : ''}`}>
              {esTachable && (
                <div
                  className={`checkbox-custom ${item.completado ? 'marcado' : ''}`}
                  onClick={() => toggleCompletado(item)}
                >
                  {item.completado ? '✓' : ''}
                </div>
              )}
              <div className="texto-item">{item.texto}</div>
              <span className={`badge-duracion ${etq.clase}`}>{etq.texto}</span>
              <button className="btn-borrar" onClick={() => borrar(item.id)}>✕</button>
            </div>
          )
        })
      )}
    </div>
  )
}