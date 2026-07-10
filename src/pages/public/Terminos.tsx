import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './legal.css'

// Términos y Condiciones públicos. Contenido estático con los datos reales de
// Pencom Travexa SAS. La política de cancelación/reembolso de vivenciales
// refleja el modelo actual: se coordina de forma personalizada por WhatsApp.
export default function Terminos() {
  useEffect(() => {
    document.title = 'Términos y Condiciones · Travexa Academy'
  }, [])

  return (
    <div className="legal-root">
      <Header />
      <main className="legal-main">
        <div className="legal-container">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Términos y Condiciones</h1>
          <p className="legal-updated">Última actualización: julio de 2026</p>

          <p className="legal-intro">
            Estos Términos y Condiciones regulan el uso de la plataforma Travexa Academy,
            operada por Pencom Travexa SAS. Al registrarte y usar la plataforma, aceptás
            estos términos.
          </p>

          <h2>1. Aceptación de los términos</h2>
          <p>
            Al crear una cuenta o usar Travexa Academy declarás haber leído y aceptado estos
            Términos y Condiciones y nuestra <Link to="/privacidad">Política de Privacidad</Link>.
            Si no estás de acuerdo, no debés utilizar la plataforma.
          </p>

          <h2>2. Descripción del servicio</h2>
          <p>Travexa Academy es una plataforma de formación para el trade turístico que ofrece:</p>
          <ul>
            <li>
              <strong>Formación:</strong> cursos y contenidos educativos (grabados, en vivo y
              material de lectura) sobre la actividad turística.
            </li>
            <li>
              <strong>Vivenciales:</strong> viajes educativos grupales (fam trips) organizados
              por Travexa.
            </li>
          </ul>
          <p>
            El registro en la plataforma es gratuito. Cada usuario paga únicamente por el
            contenido o la experiencia que decide adquirir.
          </p>

          <h2>3. Cuenta de usuario</h2>
          <p>
            Sos responsable de mantener la confidencialidad de tus credenciales y de toda la
            actividad que ocurra en tu cuenta. Los datos que cargás deben ser veraces y
            actualizados. Podés iniciar sesión con correo y contraseña o con tu cuenta de
            Google.
          </p>

          <h2>4. Pagos</h2>
          <h3>4.1. Cursos</h3>
          <p>
            Los cursos se abonan dentro de la plataforma mediante Mercado Pago, con un pago
            único por curso. El acceso al contenido se habilita una vez confirmado el pago.
          </p>
          <h3>4.2. Vivenciales</h3>
          <p>
            <strong>El pago de los vivenciales se gestiona por fuera de la plataforma.</strong>{' '}
            Travexa Academy no procesa cobros de vivenciales ni funciona como checkout para
            estas experiencias. La reserva y el pago se coordinan directamente con el equipo
            de Travexa por WhatsApp, y el pago se realiza por transferencia bancaria según los
            datos que el equipo te indique. Los comprobantes que subas a la plataforma son un
            respaldo documental que el equipo de Travexa verifica manualmente.
          </p>

          <h2>5. Cancelaciones y reembolsos de vivenciales</h2>
          <p>
            Las condiciones de cancelación y reembolso de cada vivencial se coordinan
            directamente con Yesica Robles por WhatsApp, de forma personalizada según la
            experiencia y la anticipación de la baja. Al confirmar tu lugar en un vivencial,
            estas condiciones te son comunicadas explícitamente antes de realizar cualquier
            pago.
          </p>

          <h2>6. Propiedad intelectual</h2>
          <p>
            Todo el contenido de la plataforma —cursos, videos, materiales, marca y diseño— es
            propiedad de Pencom Travexa SAS o de sus respectivos instructores/licenciantes y
            está protegido por la normativa de propiedad intelectual. El acceso a un curso te
            otorga una licencia personal e intransferible de uso: no podés descargar,
            reproducir, redistribuir ni comercializar el contenido sin autorización expresa.
          </p>

          <h2>7. Conducta del usuario</h2>
          <p>Al usar la plataforma te comprometés a no:</p>
          <ul>
            <li>Compartir tus credenciales o dar acceso al contenido a terceros.</li>
            <li>Intentar descargar, copiar o redistribuir el contenido de los cursos.</li>
            <li>Publicar reseñas o comentarios ofensivos, falsos o que infrinjan derechos de terceros.</li>
            <li>Usar la plataforma con fines ilícitos o que afecten su normal funcionamiento.</li>
          </ul>

          <h2>8. Disponibilidad del servicio</h2>
          <p>
            Trabajamos para mantener la plataforma disponible, pero puede haber interrupciones
            por mantenimiento, actualizaciones o causas ajenas a nuestro control. No
            garantizamos disponibilidad ininterrumpida.
          </p>

          <h2>9. Limitación de responsabilidad</h2>
          <p>
            Travexa no será responsable por daños indirectos o incidentales derivados del uso
            o la imposibilidad de uso de la plataforma, en la medida permitida por la ley
            aplicable.
          </p>

          <h2>10. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos en cualquier momento. Los cambios rigen desde su
            publicación en esta página, y la fecha de "última actualización" reflejará la
            versión vigente.
          </p>

          <h2>11. Ley aplicable y jurisdicción</h2>
          <p>
            Estos términos se rigen por las leyes de la República Argentina. Ante cualquier
            controversia, las partes se someten a los Tribunales Ordinarios de Quilmes,
            Provincia de Buenos Aires.
          </p>

          <h2>12. Contacto</h2>
          <p>
            Ante cualquier consulta sobre estos términos, escribinos a{' '}
            <a href="mailto:pencom.travel@gmail.com">pencom.travel@gmail.com</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
