// Estado de error para las listas del backoffice. A propósito distinto del estado
// vacío: un fallo de query/RLS NO es "no hay datos", y confundirlos ya nos costó
// un bug crítico (recursión de RLS que se veía como "0 resultados"). Mostramos el
// mensaje real y un botón para reintentar.
interface Props {
  error: unknown
  onRetry?: () => void
}

export default function ListErrorState({ error, onRetry }: Props) {
  const message = error instanceof Error ? error.message : 'Error desconocido al cargar los datos.'
  return (
    <div className="grid-empty">
      <div className="empty-state">
        <div className="empty-state-icon" style={{ color: 'var(--danger, #dc2626)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
          </svg>
        </div>
        <h4>No se pudieron cargar los datos</h4>
        <p>Esto es un error, no una lista vacía. Reintentá; si persiste, revisá la consola o avisá al equipo.</p>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'monospace', marginTop: 4, wordBreak: 'break-word' }}>{message}</p>
        {onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>Reintentar</button>}
      </div>
    </div>
  )
}
