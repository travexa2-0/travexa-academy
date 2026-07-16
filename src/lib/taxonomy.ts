// Taxonomía ÚNICA de los datos de asesor.
//
// Fuente de verdad compartida por el onboarding (paso 2 "Contanos cómo trabajás")
// y por "Tus datos" del perfil. Antes cada pantalla definía sus propias listas con
// etiquetas parecidas pero distintas, y como escriben la MISMA columna de
// academy_profiles, un valor guardado en un lado no matcheaba las opciones del otro
// (el <select> aparecía vacío). Acá queda una sola lista por campo.
//
// `value` = lo que se persiste en academy_profiles (NO cambiar sin migrar los datos
// existentes). `label` = lo que ve el usuario. Los `value` coinciden con lo que ya
// hay cargado en la base, así que este cambio no requiere migración.

export interface Opcion {
  value: string
  label: string
}

// academy_profiles.tipo_vendedor
export const TIPO_VENDEDOR_OPCIONES: Opcion[] = [
  { value: 'Freelance',                label: 'Freelance independiente' },
  { value: 'Agencia pequeña',          label: 'Agencia pequeña (1 a 5 personas)' },
  { value: 'Agencia mediana o grande', label: 'Agencia mediana o grande' },
  { value: 'Otro',                     label: 'Otro' },
]

// academy_profiles.anos_experiencia
export const EXPERIENCIA_OPCIONES: Opcion[] = [
  { value: 'Menos de 1', label: 'Menos de 1 año' },
  { value: '1 a 3',      label: '1 a 3 años' },
  { value: '3 a 5',      label: '3 a 5 años' },
  { value: '5 a 10',     label: '5 a 10 años' },
  { value: 'Más de 10',  label: 'Más de 10 años' },
]

// academy_profiles.genero
export const GENERO_OPCIONES: Opcion[] = [
  { value: 'Femenino',          label: 'Femenino' },
  { value: 'Masculino',         label: 'Masculino' },
  { value: 'No binario',        label: 'No binario' },
  { value: 'Otro',              label: 'Otro' },
  { value: 'Prefiero no decir', label: 'Prefiero no decir' },
]
