import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLogin, onIrARegistro }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('Correo o contraseña incorrectos')
      return
    }

    onLogin(data.user)
  }

  return (
    <div className="login-container">
      <h2>🍓 Control de Gastos</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo"
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
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
        <span
          style={{ color: 'var(--lavender-dark)', cursor: 'pointer', fontWeight: 600 }}
          onClick={onIrARegistro}
        >
          ¿Tienes un negocio nuevo? Créalo aquí
        </span>
      </p>
    </div>
  )
}