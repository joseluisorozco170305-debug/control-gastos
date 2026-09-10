import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function GraficaSaldo({ negocioId, refrescar }) {
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    calcularSaldos()
  }, [refrescar, negocioId])

  const calcularSaldos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .eq('negocio_id', negocioId)

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

  return (
    <div className="balance-section">
      <h3>Saldo actual</h3>
      <div className="balance-cards">
        <div className="balance-card efectivo">
          <div className="label">Efectivo</div>
          <div className="amount">${datos[0]?.saldo.toFixed(2)}</div>
        </div>
        <div className="balance-card banco">
          <div className="label">Banco</div>
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