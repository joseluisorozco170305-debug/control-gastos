import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function GananciasPorDia({ negocioId, refrescar }) {
  const [datos, setDatos] = useState([])
  const [mejorDia, setMejorDia] = useState(null)
  const [peorDia, setPeorDia] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (negocioId) calcular()
  }, [negocioId, refrescar])

  const calcular = async () => {
    setCargando(true)

    const hace7dias = new Date()
    hace7dias.setDate(hace7dias.getDate() - 6)
    hace7dias.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('movimientos')
      .select('tipo, monto, created_at')
      .eq('negocio_id', negocioId)
      .gte('created_at', hace7dias.toISOString())

    if (error || !data) {
      setCargando(false)
      return
    }

    const porDia = {}

    // Prellenar los últimos 7 días con $0, así aparecen aunque no haya movimientos
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hace7dias)
      fecha.setDate(fecha.getDate() + i)
      const clave = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
      porDia[clave] = 0
    }

    data.forEach((m) => {
      const fecha = new Date(m.created_at)
      const clave = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
      const signo = m.tipo === 'ingreso' ? 1 : -1
      porDia[clave] = (porDia[clave] || 0) + Number(m.monto) * signo
    })

    const lista = Object.entries(porDia).map(([dia, neto]) => ({
      dia,
      neto: Number(neto.toFixed(2)),
    }))

    setDatos(lista)

    const ordenado = [...lista].sort((a, b) => b.neto - a.neto)
    setMejorDia(ordenado[0])
    setPeorDia(ordenado[ordenado.length - 1])

    setCargando(false)
  }

  if (cargando) return null

  return (
    <div className="movements-section" style={{ marginTop: 20 }}>
      <h3>Ganancias por día (últimos 7 días)</h3>

      {mejorDia && peorDia && (
        <div className="ganancias-detalle" style={{ marginBottom: 10, marginTop: 0 }}>
          <div className="item">
            <div className="label">Mejor día</div>
            <div className="valor" style={{ color: 'var(--mint-dark)', fontSize: 16 }}>
              {mejorDia.dia} (${mejorDia.neto.toFixed(2)})
            </div>
          </div>
          <div className="item">
            <div className="label">Día más flojo</div>
            <div className="valor" style={{ color: 'var(--coral-dark)', fontSize: 16 }}>
              {peorDia.dia} (${peorDia.neto.toFixed(2)})
            </div>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={datos}>
          <XAxis dataKey="dia" stroke="#9891A3" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis stroke="#9891A3" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip cursor={{ fill: 'transparent' }} formatter={(v) => `$${v}`} />
          <Bar dataKey="neto" radius={[6, 6, 0, 0]}>
            {datos.map((d, i) => (
              <Cell key={i} fill={d.neto >= 0 ? '#ABDCC3' : '#F6BCC2'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}