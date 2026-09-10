import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function RegistroNegocio({ onRegistrado, onVolver }) {
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [nombreJefe, setNombreJefe] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleRegistro = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    const { data, error } = await supabase.functions.invoke('registrar-negocio', {
      body: { email, password, nombreJefe, nombreNegocio },
    })

    if (error) {
      setCargando(false)
      setError('Error al crear la cuenta: ' + error.message)
      return
    }

    if (data?.error) {
      setCargando(false)
      setError(data.error)
      return
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setCargando(false)

    if (loginError) {
      setError('Cuenta creada. Ve a "Inicia sesión" para entrar.')
      return
    }

    onRegistrado(loginData.user)
  }

  return (
    <div className="login-container">
      <h2>Crea tu negocio</h2>
      <form onSubmit={handleRegistro}>
        <input
          type="text"
          placeholder="Nombre del negocio"
          value={nombreNegocio}
          onChange={(e) => setNombreNegocio(e.target.value)}
          className="form-field"
          required
        />
        <input
          type="text"
          placeholder="Tu nombre"
          value={nombreJefe}
          onChange={(e) => setNombreJefe(e.target.value)}
          className="form-field"
          required
        />
        <input
          type="email"
          placeholder="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-field"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-field"
          required
          minLength={6}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={cargando} className="btn-primary" style={{ width: '100%' }}>
          {cargando ? 'Creando...' : 'Crear cuenta y negocio'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
        <span
          style={{ color: 'var(--lavender-dark)', cursor: 'pointer', fontWeight: 600 }}
          onClick={onVolver}
        >
          ¿Ya tienes cuenta? Inicia sesión
        </span>
      </p>
    </div>
  )
}