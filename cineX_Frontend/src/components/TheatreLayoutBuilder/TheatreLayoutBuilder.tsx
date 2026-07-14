import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useTheatreState } from './useTheatreState'
import { loadLayout } from './loadLayout'
import { saveLayout } from './saveLayout'
import { SEAT_CONFIG, SEAT_TYPES } from './constants'
import type { SeatType, RowItem, Seat, Zone } from './constants'
import { useDarkMode } from './useDarkMode'

// ── Seat Component ──
function SeatCell({
  seat,
  mode,
  isEditSelected,
  isPvBooked,
  isPvSelected,
  onToggleSelect,
  onRemove,
  onPvSelect,
  rowLabel,
  colIdx,
}: {
  seat: Seat
  mode: 'edit' | 'preview'
  isEditSelected: boolean
  isPvBooked: boolean
  isPvSelected: boolean
  onToggleSelect: () => void
  onRemove: () => void
  onPvSelect: () => void
  rowLabel: string
  colIdx: number
}) {
  const cfg = SEAT_CONFIG[seat.type]
  const dark = useDarkMode()
  const bg = dark ? cfg.darkBg : cfg.bg
  const border = dark ? cfg.darkBorder : cfg.border
  const h = cfg.height

  // Removed in preview → render nothing
  if (seat.removed && mode === 'preview') return null

  // Removed in edit → ghost seat
  if (seat.removed && mode === 'edit') {
    return (
      <div
        style={{ width: 28, height: h, borderRadius: '4px 4px 8px 8px' }}
        className="border-[1.5px] border-dashed border-muted-foreground/35 bg-transparent pointer-events-none relative flex items-end justify-center"
      >
        <span className="text-[7.5px] opacity-[0.4] leading-none pb-[3px] font-semibold">{colIdx + 1}</span>
      </div>
    )
  }

  let filter = ''
  let outline = ''

  if (mode === 'edit' && isEditSelected) {
    outline = '2px solid #3b82f6'
  }
  if (mode === 'preview' && isPvSelected) {
    outline = `2.5px solid ${border}`
    filter = 'brightness(1.15)'
  }
  if (mode === 'preview' && isPvBooked) {
    return (
      <div
        style={{
          width: 28,
          height: h,
          borderRadius: '4px 4px 8px 8px',
          backgroundColor: bg,
          border: `1.5px solid ${border}`,
          opacity: 0.18,
          cursor: 'not-allowed',
        }}
        className="relative flex items-end justify-center pointer-events-none"
      >
        <span className="text-[7.5px] opacity-[0.4] leading-none pb-[3px] font-semibold">{colIdx + 1}</span>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={mode === 'edit' ? isEditSelected : isPvSelected}
      aria-label={`${seat.type} seat ${colIdx + 1}, row ${rowLabel}`}
      onClick={() => (mode === 'edit' ? onToggleSelect() : onPvSelect())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') mode === 'edit' ? onToggleSelect() : onPvSelect()
      }}
      style={{
        width: 28,
        height: h,
        borderRadius: '4px 4px 8px 8px',
        backgroundColor: bg,
        border: `1.5px solid ${border}`,
        outline: outline || undefined,
        outlineOffset: outline ? '1px' : undefined,
        filter: filter || undefined,
      }}
      className="relative flex items-end justify-center cursor-pointer transition-all duration-150 group/seat select-none hover:brightness-[1.12] hover:scale-105 shadow-sm"
    >
      <span className="text-[7.5px] opacity-[0.4] leading-none pb-[3px] font-semibold">{colIdx + 1}</span>
      {mode === 'edit' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -top-[6px] -right-[6px] w-[14px] h-[14px] rounded-full bg-destructive text-destructive-foreground text-[9px] leading-none flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition-opacity z-10 cursor-pointer shadow-md hover:scale-110"
          aria-label="Remove seat"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Aisle / Column Gap between seats ──
function AisleOrGap({
  si,
  aisles,
  mode,
  colGap,
  rowH,
  onToggle,
}: {
  si: number
  aisles: Set<number>
  mode: 'edit' | 'preview'
  colGap: number
  rowH: number
  onToggle: (idx: number) => void
}) {
  if (si === 0) return null
  const idx = si - 1

  if (aisles.has(idx)) {
    return (
      <div
        style={{ width: 22, height: rowH }}
        className="relative flex items-center justify-center shrink-0 group/aisle"
      >
        <div className="w-[2px] h-full bg-border/60 border-dashed border-l border-r border-transparent" />
        {mode === 'edit' && (
          <button
            onClick={() => onToggle(idx)}
            className="absolute top-0 right-0 w-[14px] h-[14px] rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center opacity-0 group-hover/aisle:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
          >
            ×
          </button>
        )}
      </div>
    )
  }

  if (mode === 'edit') {
    return (
      <div
        role="button"
        tabIndex={0}
        title="Click to insert vertical aisle"
        aria-label={`Insert vertical aisle after column ${si}`}
        onClick={() => onToggle(idx)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onToggle(idx)
        }}
        style={{ width: colGap, height: rowH }}
        className="shrink-0 cursor-pointer rounded-sm transition-colors duration-100 hover:bg-primary/20"
      />
    )
  }

  return <div style={{ width: colGap }} className="shrink-0" />
}

function RowRenderer({
  row,
  mode,
  colAisles,
  colGap,
  selected,
  pvBooked,
  pvSelected,
  onToggleSelect,
  onRemoveSeat,
  onPvSelect,
  onSelectRow,
  onRemoveRow,
  onToggleColAisle,
  zones,
  onRowZoneChange,
}: {
  row: RowItem
  mode: 'edit' | 'preview'
  colAisles: Set<number>
  colGap: number
  selected: Set<number>
  pvBooked: Set<number>
  pvSelected: Set<number>
  onToggleSelect: (id: number) => void
  onRemoveSeat: (id: number) => void
  onPvSelect: (id: number) => void
  onSelectRow: (id: number) => void
  onRemoveRow: (id: number) => void
  onToggleColAisle: (idx: number) => void
  zones: Zone[]
  onRowZoneChange: (id: number, zoneType: string) => void
}) {
  const label = row.rowLabel
  const rowH = row.seats.some((s) => !s.removed && s.type === 'RECLINER') ? 44 : 26

  const allRemovedPreview = mode === 'preview' && row.seats.every((s) => s.removed)
  if (allRemovedPreview) return null

  const rowZone = zones.find((z) => z.type === row.zone)

  return (
    <div className="flex items-center group/row py-0.5">
      {/* Row Label / Selector */}
      {mode === 'edit' ? (
        <div className="flex items-center gap-1.5 w-16 shrink-0 pr-2 justify-end">
          {/* Row Zone Color Dot Indicator / Selector Dropdown */}
          <select
            value={row.zone}
            onChange={(e) => onRowZoneChange(row.id, e.target.value)}
            className="w-3.5 h-3.5 rounded-full border border-border cursor-pointer text-[0px] focus:outline-none focus:ring-1 focus:ring-ring shrink-0 shadow-sm"
            style={{ backgroundColor: rowZone?.color ?? '#CCCCCC' }}
            title={`Change row zone (Current: ${rowZone?.name || row.zone})`}
          >
            {zones.map((z) => (
              <option key={z.type} value={z.type}>
                {z.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => onSelectRow(row.id)}
            className="text-[11px] font-mono font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            title="Click to select all seats in row"
          >
            {label}
          </button>
        </div>
      ) : (
        <span className="w-16 shrink-0 pr-2 justify-end flex items-center gap-1.5 text-[11px] font-mono font-bold text-muted-foreground select-none">
          <span
            className="w-2.5 h-2.5 rounded-full border border-border shrink-0"
            style={{ backgroundColor: rowZone?.color ?? '#CCCCCC' }}
          />
          {label}
        </span>
      )}

      {/* Seats Map Container */}
      <div className="flex items-end bg-card/10 dark:bg-card/5 px-2.5 py-1 rounded-md border border-transparent hover:border-border/20 transition-colors">
        {row.seats.map((seat, si) => (
          <div key={seat.id} className="flex items-end" style={{ gap: 0 }}>
            <AisleOrGap
              si={si}
              aisles={colAisles}
              mode={mode}
              colGap={colGap}
              rowH={rowH}
              onToggle={onToggleColAisle}
            />
            <SeatCell
              seat={seat}
              mode={mode}
              isEditSelected={selected.has(seat.id)}
              isPvBooked={pvBooked.has(seat.id)}
              isPvSelected={pvSelected.has(seat.id)}
              onToggleSelect={() => onToggleSelect(seat.id)}
              onRemove={() => onRemoveSeat(seat.id)}
              onPvSelect={() => onPvSelect(seat.id)}
              rowLabel={label}
              colIdx={si}
            />
          </div>
        ))}
      </div>

      {/* Remove row button (edit only) */}
      {mode === 'edit' && (
        <button
          onClick={() => onRemoveRow(row.id)}
          className="ml-2.5 w-5 h-5 rounded-full text-xs flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer shrink-0 border border-transparent hover:border-destructive/20"
          title="Delete entire row"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Main Component ──
interface TheatreLayoutBuilderProps {
  screenId: number
  screenName: string
  maxCapacity: number
  soundSystem?: string
  projection?: string
  onClose: () => void
  onSaveSuccess?: () => void
}

export default function TheatreLayoutBuilder({
  screenId,
  screenName,
  maxCapacity,
  soundSystem,
  projection,
  onClose,
  onSaveSuccess,
}: TheatreLayoutBuilderProps) {
  const state = useTheatreState()
  const {
    layout,
    colAisles,
    rowAisles,
    zones,
    activeType,
    selected,
    mode,
    rowGap,
    colGap,
    pvBooked,
    pvSelected,
    pvTotal,
    stats,
    setRowGap,
    setColGap,
    setSelected,
    setLayout,
    setColAisles,
    setRowAisles,
    setZones,
    enterPreview,
    enterEdit,
    addRow,
    copyLastRow,
    removeRow,
    addColumn,
    removeColumn,
    removeSeat,
    toggleSelected,
    selectRow,
    deleteSelected,
    assignType,
    toggleAisle,
    toggleRowAisle,
    relabelRows,
    updateZoneMultiplier,
    updateZoneName,
    removeCustomZone,
    toggleRowZone,
    togglePvSelected,
    setActiveTypeAndAssign,
    undo,
  } = state

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch initial layout on mount
  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const data = await loadLayout(screenId)
        if (active) {
          setLayout(data.layout)
          setColAisles(data.colAisles)
          setRowAisles(data.rowAisles)
          setZones(data.zones)
          setRowGap(data.rowGap)
          setColGap(data.colGap)
        }
      } catch (err) {
        console.error('Failed to load layout:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [screenId, setLayout, setColAisles, setRowAisles, setZones, setRowGap, setColGap])

  const handleSave = async () => {
    try {
      setSaving(true)
      // Check maximum capacity limit
      if (stats.total > maxCapacity) {
        alert(`Cannot save! Layout has ${stats.total} seats, which exceeds the Screen maximum capacity of ${maxCapacity}.`)
        return
      }
      await saveLayout(screenId, layout, colAisles, rowAisles, zones, rowGap, colGap)
      onSaveSuccess?.()
    } catch (err: any) {
      console.error('Failed to save layout:', err)
      alert(err.response?.data?.message || 'Error occurred while saving layout')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div className="w-8 h-8 rounded-full border-2 border-t-primary animate-spin" />
        <span className="text-sm font-medium mt-3 text-muted-foreground">Loading interactive seating canvas...</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background text-foreground z-50 flex flex-col overflow-hidden select-none font-sans">
      {/* ── Premium Full-Screen Top Header ── */}
      <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            ←
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight">{screenName}</h1>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
              <span>Capacity: {stats.total} / {maxCapacity} seats</span>
              {soundSystem && (
                <>
                  <span>•</span>
                  <span>{soundSystem}</span>
                </>
              )}
              {projection && (
                <>
                  <span>•</span>
                  <span>{projection}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex bg-muted rounded-lg p-0.5 border border-border/30">
            <Button
              variant={mode === 'edit' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={enterEdit}
              className={`h-7 px-3.5 text-xs ${mode === 'edit' ? 'shadow-sm font-bold' : 'font-medium'}`}
            >
              Design Canvas
            </Button>
            <Button
              variant={mode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={enterPreview}
              className={`h-7 px-3.5 text-xs ${mode === 'preview' ? 'shadow-sm font-bold' : 'font-medium'}`}
            >
              Booking Preview
            </Button>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 font-bold shadow-md shadow-primary/10 transition-transform active:scale-95"
          >
            {saving ? 'Saving...' : 'Save Design'}
          </Button>
        </div>
      </header>

      {/* ── Main Workplace Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TOOLBAR: Seating Editor Controls (Edit Mode only) */}
        {mode === 'edit' && (
          <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Seat Paint Brush</h3>
              <div className="flex flex-col gap-1.5">
                {SEAT_TYPES.map((t) => {
                  const cfg = SEAT_CONFIG[t]
                  const isActive = activeType === t
                  const isZoneActive = zones.some((z) => z.type === t)
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTypeAndAssign(t)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary/10 border-primary text-primary shadow-sm'
                          : 'bg-card hover:bg-muted border-border text-foreground/80 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-border shadow-sm shrink-0"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span>{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                      </div>
                      {!isZoneActive && (
                        <span className="text-[9px] text-muted-foreground border border-border px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          Inactive
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator className="bg-border/60" />

            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Grid Modifiers</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" onClick={() => addRow()} className="h-8 text-xs font-semibold">
                  ＋ Row
                </Button>
                <Button variant="outline" size="sm" onClick={copyLastRow} className="h-8 text-xs font-semibold">
                  ⎘ Copy Row
                </Button>
                <Button variant="outline" size="sm" onClick={addColumn} className="h-8 text-xs font-semibold">
                  ＋ Column
                </Button>
                <Button variant="outline" size="sm" onClick={removeColumn} className="h-8 text-xs font-semibold">
                  － Column
                </Button>
              </div>
            </div>

            <Separator className="bg-border/60" />

            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Grid Spacing</h3>
              <div className="flex flex-col gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Vertical Row Gap</span>
                    <span>{rowGap}px</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={28}
                    value={rowGap}
                    onChange={(e) => setRowGap(Number(e.target.value))}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Horizontal Col Gap</span>
                    <span>{colGap}px</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={14}
                    value={colGap}
                    onChange={(e) => setColGap(Number(e.target.value))}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-border/60" />

            <div className="space-y-2.5 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={relabelRows}
                className="w-full h-8 text-xs font-semibold border-muted-foreground/30 hover:border-foreground"
              >
                🔢 Relabel Sequentially
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                className="w-full h-8 text-xs font-semibold border-muted-foreground/30 hover:border-foreground"
              >
                ↩ Undo Action
              </Button>
            </div>
          </aside>
        )}

        {/* CENTER INTERACTIVE CANVAS: Seating Grid Area */}
        <main className="flex-1 bg-[#101010] flex flex-col overflow-auto relative p-8 select-none">
          {/* Grid canvas wrapper */}
          <div className="flex-1 flex flex-col justify-center items-center py-6 min-h-[500px]">
            {/* The seats grid, reversed rows list so back rows (high row index) are on top, Screen at bottom */}
            <div className="flex flex-col items-center select-none" style={{ gap: rowGap }}>
              {[...layout].reverse().map((row, ri) => {
                const actualIndex = layout.length - 1 - ri
                return (
                  <div key={row.id} className="flex flex-col items-center">
                    {/* Row Item */}
                    <RowRenderer
                      row={row}
                      mode={mode}
                      colAisles={colAisles}
                      colGap={colGap}
                      selected={selected}
                      pvBooked={pvBooked}
                      pvSelected={pvSelected}
                      onToggleSelect={toggleSelected}
                      onRemoveSeat={removeSeat}
                      onPvSelect={togglePvSelected}
                      onSelectRow={selectRow}
                      onRemoveRow={removeRow}
                      onToggleColAisle={toggleAisle}
                      zones={zones}
                      onRowZoneChange={toggleRowZone}
                    />
                    {/* Row Aisle Gap (Horizontal aisle) */}
                    {rowAisles.has(actualIndex) && (
                      <div
                        style={{ height: 26 }}
                        className="relative flex items-center justify-center w-full group/row-aisle my-1"
                      >
                        <div className="w-[85%] h-px bg-border/40 border-dashed border-t border-b border-transparent" />
                        {mode === 'edit' && (
                          <button
                            onClick={() => toggleRowAisle(actualIndex)}
                            className="absolute right-6 w-[14px] h-[14px] rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center opacity-0 group-hover/row-aisle:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                    {/* In edit mode, render a horizontal gap inserter bar below rows */}
                    {mode === 'edit' && !rowAisles.has(actualIndex) && (
                      <div
                        role="button"
                        tabIndex={0}
                        title="Click to insert horizontal walkgap"
                        onClick={() => toggleRowAisle(actualIndex)}
                        className="w-[85%] h-1 rounded-sm opacity-0 hover:opacity-100 hover:bg-primary/20 cursor-pointer transition-all duration-100 my-0.5"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* SCREEN / STAGE INDICATOR */}
            <div className="w-[450px] max-w-full flex flex-col items-center gap-1.5 mt-16 mb-4 select-none">
              <span className="text-[10px] tracking-[5px] text-muted-foreground font-bold uppercase select-none opacity-80">
                Screen / Stage
              </span>
              <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-blue-600 via-primary to-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)] border-b border-white/20" />
            </div>
          </div>

          {/* Quick Edit Float Panel (Edit Mode only) */}
          {mode === 'edit' && selected.size > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card border border-border shadow-xl text-xs z-20 animate-in fade-in slide-in-from-bottom-3 duration-250 select-none">
              <span className="font-bold text-primary">✓ {selected.size} selected</span>
              <div className="h-4 w-px bg-border shrink-0" />
              {zones.map((z) => (
                <Button
                  key={z.type}
                  variant="ghost"
                  size="xs"
                  onClick={() => assignType(z.type as SeatType)}
                  className="h-7 px-2.5 text-xs font-semibold hover:bg-muted"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-border mr-1.5 shrink-0"
                    style={{ backgroundColor: z.color }}
                  />
                  {z.name}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="xs"
                onClick={deleteSelected}
                className="h-7 px-2.5 text-xs font-bold text-destructive hover:bg-destructive/10"
              >
                🗑 Remove
              </Button>
              <div className="h-4 w-px bg-border shrink-0" />
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelected(new Set())}
                className="h-7 px-2 text-xs font-medium text-muted-foreground"
              >
                Clear
              </Button>
            </div>
          )}
        </main>

        {/* RIGHT PANEL: Zones Manager Sidebar (Edit Mode only) */}
        {mode === 'edit' && (
          <aside className="w-80 border-l border-border bg-card/30 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                Zones & Multipliers
              </h3>
              <div className="flex flex-col gap-3">
                {zones.map((z) => (
                  <div
                    key={z.type}
                    className="p-3 rounded-lg border border-border bg-card/60 flex flex-col gap-2 relative group/zone"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
                        style={{ backgroundColor: z.color }}
                      />
                      <Input
                        value={z.name}
                        onChange={(e) => updateZoneName(z.type, e.target.value)}
                        className="h-6 w-32 text-xs font-bold border-transparent hover:border-input focus:border-ring bg-transparent p-0 px-1"
                        placeholder="Zone name"
                      />
                      {z.type !== 'SILVER' && (
                        <button
                          onClick={() => removeCustomZone(z.type)}
                          className="ml-auto w-5 h-5 rounded-full text-xs flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover/zone:opacity-100 transition-opacity cursor-pointer border border-transparent hover:border-destructive/10"
                          title="Remove this zone type"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">Multiplier:</span>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={z.priceMultiplier}
                          step={0.1}
                          min={0.5}
                          max={5.0}
                          onChange={(e) => updateZoneMultiplier(z.type, Number(e.target.value))}
                          className="h-6 w-16 text-xs text-center border-border hover:border-input focus:border-ring bg-background/50 px-1"
                        />
                        <span className="text-[11px] font-bold text-muted-foreground">x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-border/60" />

            <div className="text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
              <h4 className="font-bold text-foreground mb-1 text-xs">Designer Quick Instructions</h4>
              <p>• Select rows by clicking the row label, then paint their zone using the left brush or zone dropdowns.</p>
              <p>• Remove individual seats using their hover "×" button.</p>
              <p>• Add vertical spacing aisles by hovering/clicking between columns.</p>
              <p>• Add horizontal walkgaps by hovering/clicking between rows on the canvas.</p>
            </div>
          </aside>
        )}
      </div>

      {/* ── Footer Stats and Preview Bar ── */}
      <footer className="h-11 border-t border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-sm text-xs select-none">
        <div className="flex gap-4 text-muted-foreground font-semibold">
          <span>Rows: <strong className="text-foreground">{stats.rows}</strong></span>
          <span>Seats: <strong className="text-foreground">{stats.total}</strong></span>
          <span>Silver: <strong className="text-foreground">{stats.silver}</strong></span>
          <span>Gold: <strong className="text-foreground">{stats.gold}</strong></span>
          {stats.exec > 0 && <span>Exec: <strong className="text-foreground">{stats.exec}</strong></span>}
          {stats.recl > 0 && <span>Recliner: <strong className="text-foreground">{stats.recl}</strong></span>}
        </div>

        {mode === 'preview' && (
          <div className="flex items-center gap-3">
            {pvSelected.size > 0 && (
              <span className="font-bold text-primary animate-pulse">
                {pvSelected.size} seats selected · Total: ₹{pvTotal} (Base: ₹100)
              </span>
            )}
          </div>
        )}
      </footer>
    </div>
  )
}
