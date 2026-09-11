import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ListaCompras({ negocioId }) {
  const [items, setItems] = useState([])
  const [texto, setTexto] = useState('')

  useEffect(() => {
    if (negocioId) cargar()
  }, [negocioId])

  const cargar = async () => {
    const { data } = await supabase
      .from('lista_compras')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('created_at', { ascending: true })

    if (data) setItems(data)
  }

  const agregar = async () => {
    if (!texto.trim()) return
    const { data } = await supabase
      .from('lista_compras')
      .insert({ texto: texto.trim(), negocio_id: negocioId, comprado: false })
      .select()
      .single()

    if (data) setItems([...items, data])
    setTexto('')
  }

  const toggleComprado = async (item) => {
    await supabase
      .from('lista_compras')
      .update({ comprado: !item.comprado })
      .eq('id', item.id)

    setItems(items.map((i) => (i.id === item.id ? { ...i, comprado: !i.comprado } : i)))
  }

  const borrarItem = async (id) => {
    await supabase.from('lista_compras').delete().eq('id', id)
    setItems(items.filter((i) => i.id !== id))
  }

  const vaciarTodo = async () => {
    if (!confirm('¿Borrar toda la lista de compras?')) return
    await supabase.from('lista_compras').delete().eq('negocio_id', negocioId)
    setItems([])
  }

  return (
    <div className="movements-section">
      <div className="section-header">
        <h3>🛒 Lista de compras</h3>
        {items.length > 0 && (
          <button className="btn-vaciar" onClick={vaciarTodo}>Vaciar todo</button>
        )}
      </div>

      <div className="input-agregar">
        <input
          type="text"
          placeholder="Ej. Servilletas, aceite..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && agregar()}
          className="form-field"
          style={{ marginBottom: 0 }}
        />
        <button className="btn-icono" onClick={agregar}>+</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">La lista está vacía 🎉</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className={`item-lista ${item.comprado ? 'tachado' : ''}`}>
            <div
              className={`checkbox-custom ${item.comprado ? 'marcado' : ''}`}
              onClick={() => toggleComprado(item)}
            >
              {item.comprado ? '✓' : ''}
            </div>
            <div className="texto-item">{item.texto}</div>
            <button className="btn-borrar" onClick={() => borrarItem(item.id)}>✕</button>
          </div>
        ))
      )}
    </div>
  )
}