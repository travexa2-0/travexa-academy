import { useEffect, useRef, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2, FileWarning } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Worker local (evita CDN). react-pdf 10 + pdfjs 5.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface PdfOutlineItem {
  title: string
  pageNumber: number
}

interface PdfCanvasProps {
  fileUrl: string
  page: number
  onLoad?: (info: { numPages: number; outline: PdfOutlineItem[] }) => void
  onError?: () => void
  maxWidth?: number
  className?: string
}

// Visor de PDF en canvas — nunca expone link descargable. Reutilizado por lecciones y ebooks.
export default function PdfCanvas({ fileUrl, page, onLoad, onError, maxWidth = 820, className }: PdfCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [failed, setFailed] = useState(false)

  // Ancho responsivo: se ajusta al contenedor, con tope legible.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setWidth(Math.min(el.clientWidth, maxWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [maxWidth])

  const handleLoad = useCallback(
    async (doc: pdfjs.PDFDocumentProxy) => {
      let outline: PdfOutlineItem[] = []
      try {
        const raw = await doc.getOutline()
        if (raw?.length) {
          outline = (
            await Promise.all(
              raw.map(async (item): Promise<PdfOutlineItem | null> => {
                try {
                  const dest = typeof item.dest === 'string' ? await doc.getDestination(item.dest) : item.dest
                  if (!dest) return null
                  const ref = dest[0]
                  const idx = await doc.getPageIndex(ref as Parameters<typeof doc.getPageIndex>[0])
                  return { title: item.title, pageNumber: idx + 1 }
                } catch {
                  return null
                }
              }),
            )
          ).filter((x): x is PdfOutlineItem => x !== null)
        }
      } catch {
        outline = []
      }
      onLoad?.({ numPages: doc.numPages, outline })
    },
    [onLoad],
  )

  const handleError = useCallback(() => {
    setFailed(true)
    onError?.()
  }, [onError])

  return (
    <div
      ref={wrapRef}
      className={className}
      onContextMenu={e => e.preventDefault()}
      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
    >
      {failed ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <FileWarning className="h-6 w-6" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No se pudo cargar el documento.</p>
        </div>
      ) : (
        <Document
          file={fileUrl}
          onLoadSuccess={handleLoad}
          onLoadError={handleError}
          onSourceError={handleError}
          loading={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--primary-l)' }} />
            </div>
          }
          error={
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <FileWarning className="h-6 w-6" style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No se pudo cargar el documento.</p>
            </div>
          }
        >
          {width > 0 && (
            <Page
              pageNumber={page}
              width={width}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--primary-l)' }} />
                </div>
              }
            />
          )}
        </Document>
      )}
    </div>
  )
}
