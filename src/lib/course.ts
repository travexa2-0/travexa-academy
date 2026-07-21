// Cantidad aproximada de "personas capacitadas" por curso — valor ilustrativo y
// estable por curso (derivado del id, no de una query), por decisión de producto para
// dar prueba social. No cambia entre renders. Fuente única compartida por la card
// (CourseCard) y el detalle público (CourseDetail) para que muestren el mismo número.
export function vecesTomado(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return 140 + (h % 720) // 140..859
}
