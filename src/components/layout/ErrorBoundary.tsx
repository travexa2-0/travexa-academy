import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Red de seguridad a nivel de app: si un componente lanza un error no capturado
 * (ej: leer una propiedad de un campo null que viene de Supabase), en vez de dejar
 * la pantalla en blanco mostramos un estado de error legible con opción de recargar.
 * NO reemplaza los guards puntuales de cada dato — es la última línea de defensa.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary] Error no capturado:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-14 h-14 rounded-[14px] flex items-center justify-center text-[1.6rem] mb-5"
          style={{ background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.3)', color: 'var(--neon)' }}
        >
          ✦
        </div>
        <h1
          className="font-display font-bold mb-2"
          style={{ fontSize: '1.35rem', color: 'var(--text-1)', letterSpacing: '-.01em' }}
        >
          Algo salió mal
        </h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.6, marginBottom: 22 }}>
          No pudimos mostrar esta página. Probá recargar; si el problema sigue, escribinos por WhatsApp.
        </p>
        <button
          onClick={this.handleReload}
          className="font-display font-bold rounded-[10px]"
          style={{ background: 'var(--neon)', color: '#0A1E29', fontSize: '14px', padding: '11px 26px', minHeight: 44 }}
        >
          Recargar página
        </button>
      </div>
    )
  }
}
