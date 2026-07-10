import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './legal.css'

// Política de privacidad pública. Requerida por Google para publicar el OAuth
// consent screen (salir de modo Testing). Contenido estático.
// ⚠️ Los datos de la empresa marcados [COMPLETAR: ...] deben cargarse con datos
// reales de Pencom Travexa SAS antes de publicar.
export default function Privacidad() {
  useEffect(() => {
    document.title = 'Política de Privacidad · Travexa Academy'
  }, [])

  return (
    <div className="legal-root">
      <Header />
      <main className="legal-main">
        <div className="legal-container">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Política de Privacidad</h1>
          <p className="legal-updated">Última actualización: julio de 2026</p>

          <p className="legal-intro">
            En Travexa Academy nos tomamos en serio el cuidado de tus datos. Esta política
            explica qué información recolectamos, para qué la usamos, con qué proveedores de
            infraestructura trabajamos y qué derechos tenés sobre tu información.
          </p>

          <h2>1. Quién es responsable de tus datos</h2>
          <p>
            El responsable del tratamiento de los datos personales es{' '}
            <strong>Pencom Travexa SAS</strong> (en adelante, "Travexa"), operador de la
            plataforma Travexa Academy.
          </p>
          <ul>
            <li>Razón social: <strong>Pencom Travexa SAS</strong></li>
            <li>CUIT: <span className="legal-todo">[COMPLETAR: CUIT]</span></li>
            <li>Domicilio: <span className="legal-todo">[COMPLETAR: domicilio legal]</span></li>
            <li>Contacto de privacidad: <span className="legal-todo">[COMPLETAR: email de contacto]</span></li>
          </ul>

          <h2>2. Qué datos recolectamos</h2>
          <p>Recolectamos únicamente los datos necesarios para prestar el servicio:</p>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre, apellido, correo electrónico y teléfono.</li>
            <li>
              <strong>Datos de perfil de asesor:</strong> ciudad, país, años de experiencia,
              tipo de vendedor, destinos principales, biografía y foto de perfil.
            </li>
            <li>
              <strong>Comprobantes de pago de vivenciales:</strong> cuando subís un comprobante
              de una transferencia para un viaje, guardamos el archivo y los datos declarados
              (monto y fecha) para que el equipo de Travexa pueda verificarlo.
            </li>
            <li>
              <strong>Actividad en la plataforma:</strong> cursos en los que te inscribís,
              progreso, reseñas, comentarios y puntos/créditos de gamificación.
            </li>
          </ul>
          <p>
            No recolectamos datos sensibles (salud, ideología, datos biométricos, etc.) ni
            los solicitamos en ningún formulario.
          </p>

          <h2>3. Inicio de sesión con Google (Google OAuth)</h2>
          <p>
            Si elegís ingresar con tu cuenta de Google, usamos Google OAuth{' '}
            <strong>exclusivamente para autenticarte</strong>. En ese proceso leemos de tu
            perfil de Google únicamente:
          </p>
          <ul>
            <li>Tu nombre y apellido</li>
            <li>Tu dirección de correo electrónico</li>
            <li>Tu foto de perfil</li>
          </ul>
          <p>
            <strong>No accedemos a tu Gmail, Google Drive, contactos, calendario ni a ningún
            otro dato o servicio de Google.</strong> Solo usamos esa información para crear y
            mantener tu cuenta en Travexa Academy. No vendemos ni compartimos esos datos con
            terceros con fines publicitarios.
          </p>

          <h2>4. Para qué usamos tus datos</h2>
          <ul>
            <li>Crear y administrar tu cuenta y tu perfil.</li>
            <li>Darte acceso a los cursos y experiencias que adquirís.</li>
            <li>Verificar los comprobantes de pago de vivenciales.</li>
            <li>Enviarte notificaciones relacionadas con el servicio.</li>
            <li>Mejorar la plataforma y entender cómo se usa.</li>
          </ul>

          <h2>5. Proveedores de infraestructura</h2>
          <p>
            Para prestar el servicio nos apoyamos en proveedores externos que procesan datos
            por cuenta nuestra, bajo sus propias medidas de seguridad:
          </p>
          <ul>
            <li>
              <strong>Supabase:</strong> base de datos, autenticación y almacenamiento de
              archivos (incluidos los comprobantes de pago). Los servidores de nuestro
              proyecto están alojados en la región de São Paulo, Brasil.
            </li>
            <li>
              <strong>Vercel:</strong> hosting y entrega de la aplicación web.
            </li>
            <li>
              <strong>Mercado Pago:</strong> procesamiento de pagos de cursos. Al pagar un
              curso, Mercado Pago trata tus datos de pago según su propia política de
              privacidad. Travexa no almacena los datos de tu tarjeta.
            </li>
            <li>
              <strong>Google:</strong> autenticación mediante Google OAuth, según lo descripto
              en la sección 3.
            </li>
          </ul>

          <h2>6. Conservación y seguridad</h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa o mientras sean necesarios
            para prestarte el servicio y cumplir obligaciones legales. Aplicamos medidas
            técnicas y organizativas razonables para proteger tu información, incluido el
            control de acceso a nivel de base de datos y el almacenamiento de comprobantes en
            un espacio privado.
          </p>

          <h2>7. Tus derechos</h2>
          <p>
            Podés solicitar el acceso, la rectificación, la actualización o la eliminación de
            tus datos personales, así como oponerte a determinados tratamientos. Para
            ejercer estos derechos, escribinos a{' '}
            <span className="legal-todo">[COMPLETAR: email de contacto]</span>. Como titular
            de los datos, también tenés la facultad de reclamar ante la autoridad de control
            competente en materia de protección de datos personales.
          </p>

          <h2>8. Cookies y sesión</h2>
          <p>
            Usamos almacenamiento local y cookies estrictamente necesarias para mantener tu
            sesión iniciada y el funcionamiento de la plataforma. No usamos cookies de
            publicidad de terceros.
          </p>

          <h2>9. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política para reflejar cambios en el servicio o en la
            normativa aplicable. Cuando lo hagamos, actualizaremos la fecha de "última
            actualización" al inicio de esta página.
          </p>

          <h2>10. Contacto</h2>
          <p>
            Si tenés dudas sobre esta política o sobre el tratamiento de tus datos, podés
            escribirnos a <span className="legal-todo">[COMPLETAR: email de contacto]</span>.
          </p>

          <p style={{ marginTop: 32 }}>
            Ver también nuestros{' '}
            <Link to="/terminos">Términos y Condiciones</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
