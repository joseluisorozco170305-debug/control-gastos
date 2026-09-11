import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function RegistroMovimiento({ userId, negocioId, onGuardado }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [tipo, setTipo] = useState('ingreso')
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const limpiarForm = () => {
    setTipo('ingreso')
    setMonto('')
    setMetodoPago('efectivo')
    setDescripcion('')
    setError('')
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setError('')

    if (!monto || Number(monto) <= 0) {
      setError('Escribe un monto válido')
      return
    }

    setGuardando(true)

    const { error } = await supabase.from('movimientos').insert({
      tipo,
      monto: Number(monto),
      metodo_pago: metodoPago,
      descripcion,
      usuario_id: userId,
      negocio_id: negocioId,
    })

    setGuardando(false)

    if (error) {
      setError('Error al guardar: ' + error.message)
      return
    }

    limpiarForm()
    setMostrarForm(false)
    onGuardado()
  }

  if (!mostrarForm) {
    return (
      <button className="fab-button" onClick={() => setMostrarForm(true)}>
        +
      </button>
    )
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleGuardar} className="modal-card">
        <h3>💳 Registrar movimiento</h3>

        <div className="tipo-toggle">
          <div
            className={`tipo-option ingreso ${tipo === 'ingreso' ? 'active' : ''}`}
            onClick={() => setTipo('ingreso')}
          >
            💚 Ingreso
          </div>
          <div
            className={`tipo-option gasto ${tipo === 'gasto' ? 'active' : ''}`}
            onClick={() => setTipo('gasto')}
          >
            ❤️ Gasto
          </div>
        </div>

        <input
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="form-field"
          step="0.01"
          required
        />

        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="form-field"
        >
          <option value="efectivo">💵 Efectivo</option>
          <option value="tarjeta">💳 Tarjeta</option>
          <option value="transferencia">🏦 Transferencia</option>
        </select>

        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="form-field"
        />

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" disabled={guardando} className="btn-primary">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              limpiarForm()
              setMostrarForm(false)
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}