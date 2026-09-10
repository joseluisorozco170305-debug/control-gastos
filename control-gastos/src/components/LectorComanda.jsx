import { useState } from 'react'
import { supabase } from '../supabaseClient'

function parseComanda(texto) {
  const lineas = texto.split('\n').map((l) => l.trim()).filter(Boolean)
  const items = []
  let actual = null

  for (const linea of lineas) {
    const matchItem = linea.match(/^\d+\.\s*\*(\d+)\s*x\s*([^*]+)\*/i)
    if (matchItem) {
      actual = {
        cantidad: Number(matchItem[1]),
        producto: matchItem[2].trim(),
      }
      continue
    }

    const matchSubtotal = linea.match(/^Subtotal:\s*\$?([\d.,]+)/i)
    if (matchSubtotal && actual) {
      actual.precio = Number(matchSubtotal[1].replace(',', ''))
      items.push(actual)
      actual = null
    }
  }

  return items
}

export default function LectorComanda({ userId, negocioId }) {
  const [mostrar, setMostrar] = useState(false)
  const [texto, setTexto] = useState('')
  const [items, setItems] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const handleProcesar = () => {
    setError('')
    setMensaje('')
    const parsed = parseComanda(texto)
    if (parsed.length === 0) {
      setError('No se pudo identificar ningún producto. Revisa el formato del texto.')
      return
    }
    setItems(parsed)
  }

  const handleGuardar = async () => {
    setGuardando(true)
    setError('')

    const filas = items.map((it) => ({
      producto_nombre: it.producto,
      cantidad: it.cantidad,
      precio: it.precio,
      usuario_id: userId,
      negocio_id: negocioId,
    }))

    const { error: errorInsert } = await supabase.from('detalle_pedidos').insert(filas)

    if (errorInsert) {
      setGuardando(false)
      setError('Error al guardar: ' + errorInsert.message)
      return
    }

    for (const it of items) {
      const { data: existente } = await supabase
        .from('productos')
        .select('*')
        .eq('nombre', it.producto)
        .eq('negocio_id', negocioId)
        .maybeSingle()

      if (existente) {
        await supabase
          .from('productos')
          .update({ veces_pedido: (existente.veces_pedido || 0) + it.cantidad })
          .eq('id', existente.id)
      } else {
        await supabase.from('productos').insert({
          nombre: it.producto,
          precio: it.precio / it.cantidad,
          veces_pedido: it.cantidad,
          negocio_id: negocioId,
        })
      }
    }

    setGuardando(false)
    setMensaje('Pedido guardado correctamente')
    setTexto('')
    setItems([])
    setMostrar(false)
  }

  if (!mostrar) {
    return (
      <button
        className="btn-secondary"
        onClick={() => setMostrar(true)}
        style={{ width: '100%', marginTop: 12 }}
      >
        📋 Leer comanda
      </button>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 420 }}>
        <h3>Leer comanda</h3>

        {items.length === 0 ? (
          <>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pega aquí el texto completo del pedido..."
              className="form-field"
              rows={10}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            />
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button className="btn-primary" onClick={handleProcesar}>Procesar</button>
              <button className="btn-secondary" onClick={() => setMostrar(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 14 }}>
              {items.map((it, i) => (
                <div key={i} className="movement-item" style={{ borderLeftColor: '#C7B8EA' }}>
                  <div className="movement-tipo" style={{ color: '#8F76CC' }}>
                    {it.cantidad}x {it.producto}
                  </div>
                  <div className="movement-amount">${it.precio.toFixed(2)}</div>
                </div>
              ))}
            </div>
            {error && <p className="form-error">{error}</p>}
            {mensaje && <p style={{ color: '#5CA684', fontSize: 13 }}>{mensaje}</p>}
            <div className="form-actions">
              <button className="btn-primary" disabled={guardando} onClick={handleGuardar}>
                {guardando ? 'Guardando...' : 'Confirmar y guardar'}
              </button>
              <button className="btn-secondary" onClick={() => setItems([])}>
                Editar texto
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}