import { Link } from 'react-router-dom'
import './footer.css'

// Footer compartido del sitio. Vive acá (no inline en la Home) para que la Home
// y las páginas legales estáticas (/privacidad, /terminos) usen exactamente el
// mismo pie de página, incluidos los links legales.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">Travexa <span>Academy</span></div>
        <nav className="site-footer-links">
          <Link to="/cursos">Formación</Link>
          <Link to="/vivencial">Vivencial</Link>
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/terminos">Términos</Link>
          <Link to="/login">Ingresar</Link>
        </nav>
        <div className="site-footer-meta">Pencom Travexa SAS · 2026</div>
      </div>
    </footer>
  )
}
