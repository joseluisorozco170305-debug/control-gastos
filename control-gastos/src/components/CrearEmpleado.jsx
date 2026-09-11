import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function CrearEmpleado() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const limpiarForm = () => {
    setNombre('')
    setEmail('')
    setPassword('')
    setError('')
  }

  const handleCrear = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)

    const { data, error } = await supabase.functions.invoke('crear-empleado', {
      body: { email, password, nombre },
    })

    setGuardando(false)

    if (error) {
      setError('Error al crear empleado: ' + error.message)
      return
    }

    if (data?.error) {
      setError(data.error)
      return
    }

    setMensaje(`Empleado "${nombre}" creado correctamente`)
    limpiarForm()
  }

  return (
    <div className="movements-section" style={{ marginTop: 20 }}>
      <h3>👥 Empleados</h3>

      {!mostrarForm ? (
        <button
          className="btn-secondary"
          onClick={() => setMostrarForm(true)}
          style={{ width: '100%' }}
        >
          ➕ Agregar empleado
        </button>
      ) : (
        <form onSubmit={handleCrear} className="balance-card" style={{ display: 'block' }}>
          <input
            type="text"
            placeholder="Nombre del empleado"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="form-field"
            required
          />
          <input
            type="email"
            placeholder="Correo del empleado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-field"
            required
          />
          <input
            type="password"
            placeholder="Contraseña temporal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-field"
            required
            minLength={6}
          />

          {error && <p className="form-error">{error}</p>}
          {mensaje && <p style={{ color: '#5CA684', fontSize: 13 }}>{mensaje}</p>}

          <div className="form-actions">
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Creando...' : 'Crear'}
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
      )}
    </div>
  )
}