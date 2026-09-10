import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function NombreNegocio({ negocioId }) {
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (negocioId) cargarNegocio()
  }, [negocioId])

  const cargarNegocio = async () => {
    const { data } = await supabase
      .from('negocios')
      .select('nombre')
      .eq('id', negocioId)
      .maybeSingle()

    if (data) setNombre(data.nombre)
  }

  if (!nombre) return null

  return <div className="business-name">{nombre}</div>
}