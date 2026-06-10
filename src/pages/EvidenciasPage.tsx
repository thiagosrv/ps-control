import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Camera, X, Filter, Download } from 'lucide-react'
import { useVisitPhotos } from '@/hooks/useVisitPhotos'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { VisitPhoto } from '@/types/app.types'

const NAVY = 'oklch(0.188 0.075 262)'
const GOLD = 'oklch(0.838 0.176 86.4)'

export function EvidenciasPage() {
  const { fetchAll } = useVisitPhotos()
  const [photos, setPhotos] = useState<VisitPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<VisitPhoto | null>(null)
  const [filters, setFilters] = useState({ date_from: '', date_to: '', tipo: '' as '' | 'entrada' | 'saida' })

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchAll({
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      tipo: filters.tipo || undefined,
    })
    setPhotos(data)
    setLoading(false)
  }, [fetchAll, filters])

  useEffect(() => { load() }, [load])

  function clearFilters() {
    setFilters({ date_from: '', date_to: '', tipo: '' })
  }

  const hasFilters = filters.date_from || filters.date_to || filters.tipo

  return (
    <div className="space-y-5">
      <PageHeader
        title="Evidências Fotografadas"
        description={`${photos.length} foto${photos.length !== 1 ? 's' : ''} registrada${photos.length !== 1 ? 's' : ''}`}
      />

      {/* Filtros */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4" style={{ color: NAVY }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: NAVY }}>Filtros</p>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">De</label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Até</label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Tipo</label>
            <div className="flex gap-2">
              {(['', 'entrada', 'saida'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters((f) => ({ ...f, tipo: t }))}
                  className="flex-1 h-10 rounded-lg border-2 text-xs font-semibold transition-all"
                  style={{
                    borderColor: filters.tipo === t ? GOLD : 'oklch(0.908 0.008 264)',
                    backgroundColor: filters.tipo === t ? 'oklch(0.97 0.04 86)' : 'white',
                    color: filters.tipo === t ? NAVY : 'oklch(0.45 0.02 264)',
                  }}
                >
                  {t === '' ? 'Todos' : t === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Galeria */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 flex flex-col items-center gap-3 text-slate-400">
          <Camera className="h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">Nenhuma evidência fotográfica encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => {
            const emp = photo.visit?.visitor?.empreiteira?.razao_social
            const name = photo.visit?.visitor?.full_name ?? 'Sem nome'
            const funcao = photo.visit?.visitor?.funcao
            const dt = format(new Date(photo.created_at), "dd/MM · HH:mm", { locale: ptBR })
            const isEntrada = photo.tipo === 'entrada'

            return (
              <div
                key={photo.id}
                className="group relative rounded-xl overflow-hidden border shadow-sm cursor-pointer bg-slate-900"
                onClick={() => setLightbox(photo)}
              >
                <img
                  src={photo.photo_url}
                  alt={`Evidência ${photo.tipo} — ${name}`}
                  className="w-full aspect-square object-cover group-hover:opacity-90 transition-opacity"
                  loading="lazy"
                />

                {/* Badge tipo */}
                <div className="absolute top-2 left-2">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={
                      isEntrada
                        ? { backgroundColor: 'oklch(0.93 0.08 140)', color: 'oklch(0.35 0.14 140)' }
                        : { backgroundColor: 'oklch(0.93 0.08 25)', color: 'oklch(0.45 0.18 25)' }
                    }
                  >
                    {isEntrada ? 'ENTRADA' : 'SAÍDA'}
                  </span>
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-2">
                  <p className="text-white text-xs font-semibold leading-tight truncate">{name}</p>
                  <p className="text-white/60 text-[10px] truncate">
                    {funcao ? `${funcao} · ` : ''}{emp ?? dt}
                  </p>
                  {(funcao || emp) && (
                    <p className="text-white/50 text-[10px]">{dt}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setLightbox(null)}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-white font-bold text-sm">
                {lightbox.visit?.visitor?.full_name ?? '—'}
              </p>
              <p className="text-white/50 text-xs">
                {lightbox.tipo === 'entrada' ? 'Entrada' : 'Saída'} ·{' '}
                {format(new Date(lightbox.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {lightbox.visit?.visitor?.funcao && ` · ${lightbox.visit.visitor.funcao}`}
                {lightbox.visit?.visitor?.empreiteira?.razao_social &&
                  ` · ${lightbox.visit.visitor.empreiteira.razao_social}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={lightbox.photo_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Abrir original</span>
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLightbox(null)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Imagem */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            <img
              src={lightbox.photo_url}
              alt="Evidência"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
