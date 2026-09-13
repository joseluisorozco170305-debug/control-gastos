import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function inicioDia() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return hoy
}

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

export default function GraficaSaldo({ negocioId, refrescar }) {
  const [periodo, setPeriodo] = useState('total')
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    calcularSaldos()
  }, [refrescar, negocioId, periodo])

  const calcularSaldos = async () => {
    setCargando(true)

    let query = supabase
      .from('movimientos')
      .select('*')
      .eq('negocio_id', negocioId)

    if (periodo === 'dia') query = query.gte('created_at', inicioDia().toISOString())
    if (periodo === 'semana') query = query.gte('created_at', inicioSemana().toISOString())
    if (periodo === 'mes') query = query.gte('created_at', inicioMes().toISOString())

    const { data, error } = await query

    if (error) {
      setCargando(false)
      return
    }

    let saldoEfectivo = 0
    let saldoBanco = 0

    data.forEach((m) => {
      const signo = m.tipo === 'ingreso' ? 1 : -1
      const monto = Number(m.monto) * signo

      if (m.metodo_pago === 'efectivo') {
        saldoEfectivo += monto
      } else {
        saldoBanco += monto
      }
    })

    setDatos([
      { nombre: 'Efectivo', saldo: Number(saldoEfectivo.toFixed(2)), color: '#5CA684' },
      { nombre: 'Banco', saldo: Number(saldoBanco.toFixed(2)), color: '#8F76CC' },
    ])
    setCargando(false)
  }

  if (cargando) return <p style={{ color: '#9891A3' }}>Calculando saldos...</p>

  const opciones = [
    { id: 'dia', label: 'Día' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'total', label: 'Total' },
  ]

  return (
    <div className="balance-section">
      <h3>💵 Saldo {periodo === 'total' ? 'actual' : `(${opciones.find((o) => o.id === periodo)?.label.toLowerCase()})`}</h3>

      <div className="periodo-toggle-wrap" style={{ marginBottom: 14, marginTop: 0 }}>
        {opciones.map((op) => (
          <div
            key={op.id}
            className={`periodo-option ${periodo === op.id ? 'active' : ''}`}
            onClick={() => setPeriodo(op.id)}
          >
            {op.label}
          </div>
        ))}
      </div>

      <div className="balance-cards">
        <div className="balance-card efectivo">
          <div className="label">💵 Efectivo</div>
          <div className="amount">${datos[0]?.saldo.toFixed(2)}</div>
        </div>
        <div className="balance-card banco">
          <div className="label">🏦 Banco</div>
          <div className="amount">${datos[1]?.saldo.toFixed(2)}</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={datos}>
          <XAxis dataKey="nombre" stroke="#9891A3" tickLine={false} axisLine={false} />
          <YAxis stroke="#9891A3" tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: 'transparent' }} />
          <Bar dataKey="saldo" radius={[8, 8, 0, 0]}>
            {datos.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}