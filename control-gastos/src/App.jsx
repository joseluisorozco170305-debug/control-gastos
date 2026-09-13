import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import RegistroNegocio from './components/RegistroNegocio'
import RegistroMovimiento from './components/RegistroMovimiento'
import ListaMovimientos from './components/ListaMovimientos'
import GraficaSaldo from './components/GraficaSaldo'
import CrearEmpleado from './components/CrearEmpleado'
import LectorComanda from './components/LectorComanda'
import ProductosPopulares from './components/ProductosPopulares'
import NombreNegocio from './components/NombreNegocio'
import ControlGanancias from './components/ControlGanancias'
import GananciasPorDia from './components/GananciasPorDia'
import ConciliacionPedidos from './components/ConciliacionPedidos'
import ListaCompras from './components/ListaCompras'
import Pendientes from './components/Pendientes'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [refrescar, setRefrescar] = useState(0)
  const [tab, setTab] = useState('inicio')
  const [mostrarRegistro, setMostrarRegistro] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        cargarPerfil(session.user)
      } else {
        setCargando(false)
      }
    })
  }, [])

  const cargarPerfil = async (usuario) => {
    setUser(usuario)
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', usuario.id)
      .single()

    setPerfil(data)
    setCargando(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
  }

  if (cargando) return <p style={{ textAlign: 'center', marginTop: 50 }}>Cargando...</p>

  if (!user) {
    return mostrarRegistro ? (
      <RegistroNegocio onRegistrado={cargarPerfil} onVolver={() => setMostrarRegistro(false)} />
    ) : (
      <Login onLogin={cargarPerfil} onIrARegistro={() => setMostrarRegistro(true)} />
    )
  }

  const esJefe = perfil?.rol === 'jefe'

  return (
    <div className="app-container">
      <div className="app-header">
        <div>
          <NombreNegocio negocioId={perfil?.negocio_id} />
          <h2>Hola, {perfil?.nombre || user.email}</h2>
          <span className={`role-badge ${perfil?.rol}`}>{perfil?.rol}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      {tab === 'inicio' && (
        <div className="tab-content" key="inicio">
          {esJefe && <ControlGanancias negocioId={perfil?.negocio_id} refrescar={refrescar} />}
          <GraficaSaldo negocioId={perfil?.negocio_id} refrescar={refrescar} />
          <RegistroMovimiento
            userId={user.id}
            negocioId={perfil?.negocio_id}
            onGuardado={() => setRefrescar((r) => r + 1)}
          />
        </div>
      )}

      {tab === 'movimientos' && (
        <div className="tab-content" key="movimientos">
          <LectorComanda userId={user.id} negocioId={perfil?.negocio_id} />
          <ListaMovimientos
            negocioId={perfil?.negocio_id}
            refrescar={refrescar}
            onCambio={() => setRefrescar((r) => r + 1)}
          />
          <RegistroMovimiento
            userId={user.id}
            negocioId={perfil?.negocio_id}
            onGuardado={() => setRefrescar((r) => r + 1)}
          />
        </div>
      )}

      {tab === 'reportes' && (
        <div className="tab-content" key="reportes">
          <ConciliacionPedidos negocioId={perfil?.negocio_id} refrescar={refrescar} />
          {esJefe && <GananciasPorDia negocioId={perfil?.negocio_id} refrescar={refrescar} />}
          <ProductosPopulares negocioId={perfil?.negocio_id} refrescar={refrescar} />
        </div>
      )}

      {tab === 'notas' && (
        <div className="tab-content" key="notas">
          <ListaCompras negocioId={perfil?.negocio_id} />
          <Pendientes negocioId={perfil?.negocio_id} />
        </div>
      )}

      {tab === 'equipo' && esJefe && (
        <div className="tab-content" key="equipo">
          <CrearEmpleado />
        </div>
      )}

      <div className="bottom-nav">
        <button className={`nav-item ${tab === 'inicio' ? 'active' : ''}`} onClick={() => setTab('inicio')}>
          <span className="icon">🏠</span>
          Inicio
        </button>
        <button className={`nav-item ${tab === 'movimientos' ? 'active' : ''}`} onClick={() => setTab('movimientos')}>
          <span className="icon">💰</span>
          Movimientos
        </button>
        <button className={`nav-item ${tab === 'reportes' ? 'active' : ''}`} onClick={() => setTab('reportes')}>
          <span className="icon">📊</span>
          Reportes
        </button>
        <button className={`nav-item ${tab === 'notas' ? 'active' : ''}`} onClick={() => setTab('notas')}>
          <span className="icon">📝</span>
          Notas
        </button>
        {esJefe && (
          <button className={`nav-item ${tab === 'equipo' ? 'active' : ''}`} onClick={() => setTab('equipo')}>
            <span className="icon">👥</span>
            Equipo
          </button>
        )}
      </div>
    </div>
  )
}

export default App