// Fuente compartida de la tabla "Cómo conseguir créditos".
// Los montos reflejan la tabla real de la edge function award-points
// (TABLA_ACCIONES, columna `creditos`). No se hardcodea en dos lugares: tanto la
// tienda /beneficios como el modal de créditos del perfil consumen esta lista.
// Orden: mismo que el prototipo (por tipo de acción, no por monto).

export interface CreditAction {
  icon: string
  label: string
  sub: string
  creditos: number
}

export const CREDIT_EARN_ACTIONS: CreditAction[] = [
  { icon: '✈', label: 'Registrarte en Academy',      sub: 'Bono de bienvenida',              creditos: 20 },
  { icon: '👤', label: 'Completar tu perfil',          sub: 'Datos + foto + especialidades',   creditos: 50 },
  { icon: '🎓', label: 'Comprar un curso',             sub: 'Se acredita con el pago aprobado', creditos: 20 },
  { icon: '📖', label: 'Completar una lección',        sub: 'Por cada lección terminada',      creditos: 5 },
  { icon: '🏆', label: 'Completar un curso',           sub: 'Al llegar al 100%',               creditos: 40 },
  { icon: '🌎', label: 'Reservar un vivencial',        sub: 'Al confirmar tu seña',            creditos: 30 },
  { icon: '🧭', label: 'Completar un vivencial',       sub: 'La experiencia entera',           creditos: 300 },
  { icon: '⭐', label: 'Publicar una reseña',          sub: 'En cursos que cursaste',          creditos: 15 },
  { icon: '🔥', label: 'Racha de 30 días',             sub: 'Constancia premiada',             creditos: 100 },
  { icon: '🎥', label: 'Asistir a una clase en vivo',  sub: 'Por cada clase',                  creditos: 15 },
  { icon: '🤝', label: 'Invitar a un colega',          sub: 'Cuando se registra con tu link',  creditos: 20 },
  { icon: '💼', label: 'Tu referido compra',           sub: 'Su primera compra te suma',       creditos: 100 },
  { icon: '📣', label: 'Compartir un logro',           sub: 'Insignias y certificados',        creditos: 15 },
]
