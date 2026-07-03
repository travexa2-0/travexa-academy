// Curated tag suggestions ported verbatim from the approved prototype
// (travexa_academy_backoffice.html · TAG_SUGGESTIONS).

export const TAG_SUGGESTIONS = {
  cursoIncluye: ['Acceso de por vida', 'Certificado al completar', 'Recursos descargables', 'Actualizaciones incluidas', 'Plantillas editables', 'Grupo de WhatsApp de la cohorte', 'Sesión de Q&A en vivo', 'Subtítulos en español', 'Acceso desde el celular', 'Soporte por email', 'Casos reales de venta', 'Scripts de venta listos', 'Checklist descargable', 'Acceso anticipado a nuevo contenido', 'Clases grabadas', 'Ejercicios prácticos', 'Feedback personalizado', 'Comunidad de alumnos', 'Plantilla de cotización', 'Descuento en próximos cursos'],
  cursoNoIncluye: ['Mentoría 1 a 1', 'Corrección de tareas individuales', 'Certificación oficial', 'Soporte telefónico', 'Materiales impresos', 'Traducción a otros idiomas', 'Descarga de video (offline)', 'Garantía de resultados', 'Networking presencial', 'Herramientas pagas de terceros', 'Viáticos ni pasajes', 'Licencias de software', 'Revisión de casos particulares', 'Clases en vivo', 'Actualizaciones más allá de 12 meses'],
  vivIncluye: ['Traslados aeropuerto-hotel', 'Alojamiento', 'Desayuno diario', 'Cena de bienvenida', 'Entradas incluidas en el itinerario', 'Guía local de habla hispana', 'Seguro de viaje básico', 'Kit del viajero Travexa', 'Certificado de Fam Trip', 'Traslados internos durante el viaje', 'Talleres de venta incluidos', 'WiFi en el hotel', 'Coordinador de grupo Travexa', 'Almuerzo en excursiones grupales', 'Material fotográfico para reventa', 'Comunidad de alumnos del viaje', 'Regalo de bienvenida', 'Asistencia al viajero 24/7', 'Fotos profesionales del viaje', 'Constancia para el operador'],
  vivNoIncluye: ['Pasajes aéreos', 'Comidas no mencionadas', 'Gastos personales', 'Bebidas alcohólicas', 'Propinas', 'Excursiones opcionales', 'Seguro de viaje ampliado', 'Trámites de visa', 'Exceso de equipaje', 'Traslados fuera del itinerario', 'Llamadas internacionales', 'Lavandería', 'Late check-out', 'Actividades no incluidas en el itinerario', 'Vacunas o requisitos sanitarios'],
}

export const NIVEL_OPTIONS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
] as const

export const ACCESO_OPTIONS = [
  { value: 'pago', label: 'Pago' },
  { value: 'gratuito', label: 'Gratuito' },
  { value: 'b2b_incluido', label: 'Incluido en Travexa B2B' },
] as const

// Parses "mm:ss" or "h:mm:ss" or plain minutes into seconds.
export function durationToSeconds(text: string): number {
  const t = text.trim()
  if (!t) return 0
  const parts = t.split(':').map(p => parseInt(p, 10) || 0)
  if (parts.length === 1) return parts[0] * 60
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

export function secondsToDuration(seconds: number | null | undefined): string {
  const s = seconds ?? 0
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}
