import { useCallback, useMemo } from 'react'
import { useDarkMode } from './useDarkMode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SEAT_CONFIG, SEAT_TYPES, ROW_LABEL, isDarkMode } from './constants'
import type { LayoutItem, RowItem, SectionItem, SeatType, Seat } from './constants'
import { useTheatreState } from './useTheatreState'

// ── Seat Component ──
function SeatCell({
  seat, mode, isEditSelected, isPvBooked, isPvSelected,
  onToggleSelect, onRemove, onPvSelect, rowLabel, colIdx,
}: {
  seat: Seat; mode: 'edit' | 'preview'
  isEditSelected: boolean; isPvBooked: boolean; isPvSelected: boolean
  onToggleSelect: () => void; onRemove: () => void; onPvSelect: () => void
  rowLabel: string; colIdx: number
}) {
  const cfg = SEAT_CONFIG[seat.type]
  const dark = useDarkMode()
  const bg = dark ? cfg.darkBg : cfg.bg
  const border = dark ? cfg.darkBorder : cfg.border
  const h = cfg.height

  // Removed in preview → render nothing
  if (seat.removed && mode === 'preview') return null

  // Removed in edit → ghost
  if (seat.removed && mode === 'edit') {
    return (
      <div
        style={{ width: 28, height: h, borderRadius: '3px 3px 6px 6px' }}
        className="border-[1.5px] border-dashed border-[#CCCCCC] bg-transparent pointer-events-none relative flex items-end justify-center"
      >
        <span className="text-[7px] opacity-[0.38] leading-none pb-[2px]">{colIdx + 1}</span>
      </div>
    )
  }

  // Build style + classes
  let filter = ''
  let outline = ''

  if (mode === 'edit' && isEditSelected) {
    outline = '2px solid #4A7BE0'
  }
  if (mode === 'preview' && isPvSelected) {
    outline = `2.5px solid ${border}`
    filter = 'brightness(1.12)'
  }
  if (mode === 'preview' && isPvBooked) {
    return (
      <div
        style={{
          width: 28, height: h, borderRadius: '3px 3px 6px 6px',
          backgroundColor: bg, border: `1.5px solid ${border}`,
          opacity: 0.18, cursor: 'not-allowed',
        }}
        className="relative flex items-end justify-center pointer-events-none"
      >
        <span className="text-[7px] opacity-[0.38] leading-none pb-[2px]">{colIdx + 1}</span>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={mode === 'edit' ? isEditSelected : isPvSelected}
      aria-label={`${seat.type} seat ${colIdx + 1}, row ${rowLabel}`}
      onClick={() => mode === 'edit' ? onToggleSelect() : onPvSelect()}
      onKeyDown={(e) => { if (e.key === 'Enter') mode === 'edit' ? onToggleSelect() : onPvSelect() }}
      style={{
        width: 28, height: h, borderRadius: '3px 3px 6px 6px',
        backgroundColor: bg, border: `1.5px solid ${border}`,
        outline: outline || undefined,
        outlineOffset: outline ? '1px' : undefined,
        filter: filter || undefined,
      }}
      className="relative flex items-end justify-center cursor-pointer transition-[filter] duration-100 group/seat select-none hover:brightness-[1.08]"
    >
      <span className="text-[7px] opacity-[0.38] leading-none pb-[2px]">{colIdx + 1}</span>
      {/* Quick-remove button in edit mode */}
      {mode === 'edit' && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute -top-[6px] -right-[6px] w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] leading-none flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition-opacity z-10 cursor-pointer"
          aria-label="Remove seat"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Section Header ──
function SectionHeader({
  section, mode, onUpdate, onRemove, onAddRow,
}: {
  section: SectionItem; mode: 'edit' | 'preview'
  onUpdate: (field: string, value: string | number) => void
  onRemove: () => void; onAddRow: () => void
}) {
  const cfg = SEAT_CONFIG[section.seatType]
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50 group/sec">
      {/* Color dot */}
      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: cfg.color }} className="shrink-0" />

      {/* Name */}
      {mode === 'edit' ? (
        <Input
          value={section.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          className="h-6 w-36 text-xs font-medium border-transparent hover:border-input focus:border-ring bg-transparent px-1"
        />
      ) : (
        <span className="text-xs font-medium">{section.name}</span>
      )}

      {/* Price */}
      <span className="text-xs text-muted-foreground">₹</span>
      {mode === 'edit' ? (
        <Input
          type="number"
          value={section.price}
          step={50}
          onChange={(e) => onUpdate('price', Number(e.target.value))}
          className="h-6 w-20 text-xs border-transparent hover:border-input focus:border-ring bg-transparent px-1"
        />
      ) : (
        <span className="text-xs font-medium">{section.price}</span>
      )}

      {mode === 'edit' && (
        <>
          <Button variant="ghost" size="xs" onClick={onAddRow} className="text-xs">
            ＋ Row
          </Button>
          <button
            onClick={onRemove}
            className="ml-auto w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover/sec:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}

// ── Aisle / Gap between seats ──
function AisleOrGap({
  si, aisles, mode, colGap, rowH, onToggle,
}: {
  si: number; aisles: Set<number>; mode: 'edit' | 'preview'
  colGap: number; rowH: number; onToggle: (idx: number) => void
}) {
  if (si === 0) return null
  const idx = si - 1

  if (aisles.has(idx)) {
    // Full aisle
    return (
      <div
        style={{ width: 20, height: rowH }}
        className="relative flex items-center justify-center shrink-0 group/aisle"
      >
        <div className="w-px h-full bg-border" />
        {mode === 'edit' && (
          <button
            onClick={() => onToggle(idx)}
            className="absolute top-0 right-0 w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover/aisle:opacity-100 transition-opacity z-10 cursor-pointer"
          >
            ×
          </button>
        )}
      </div>
    )
  }

  if (mode === 'edit') {
    // Aisle slot (hoverable to insert)
    return (
      <div
        role="button"
        tabIndex={0}
        title="Click to insert aisle"
        aria-label={`Insert aisle after column ${si}`}
        onClick={() => onToggle(idx)}
        onKeyDown={(e) => { if (e.key === 'Enter') onToggle(idx) }}
        style={{ width: colGap, height: rowH }}
        className="shrink-0 cursor-pointer rounded-sm transition-colors duration-100 hover:bg-[rgba(74,123,224,0.14)]"
      />
    )
  }

  // Preview: plain gap
  return <div style={{ width: colGap }} className="shrink-0" />
}

// ── Row component ──
function RowRenderer({
  row, rowIndex, mode, aisles, colGap, selected, pvBooked, pvSelected,
  onToggleSelect, onRemoveSeat, onPvSelect, onSelectRow, onRemoveRow, onToggleAisle,
}: {
  row: RowItem; rowIndex: number; mode: 'edit' | 'preview'
  aisles: Set<number>; colGap: number
  selected: Set<number>; pvBooked: Set<number>; pvSelected: Set<number>
  onToggleSelect: (id: number) => void; onRemoveSeat: (id: number) => void
  onPvSelect: (id: number) => void; onSelectRow: (id: number) => void
  onRemoveRow: (id: number) => void; onToggleAisle: (idx: number) => void
}) {
  const label = ROW_LABEL(rowIndex)
  const rowH = row.seats.some(s => !s.removed && s.type === 'RECLINER') ? 44 : 26

  // In preview, check if entire row is removed
  const allRemovedPreview = mode === 'preview' && row.seats.every(s => s.removed)
  if (allRemovedPreview) return null

  return (
    <div className="flex items-end">
      {/* Row label */}
      {mode === 'edit' ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectRow(row.id)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSelectRow(row.id) }}
          className="w-8 shrink-0 flex items-center justify-center text-[11px] font-mono text-muted-foreground cursor-pointer hover:text-foreground select-none"
          style={{ height: rowH }}
          title="Click to select row"
        >
          {label}
        </div>
      ) : (
        <span
          className="w-8 shrink-0 flex items-center justify-center text-[11px] font-mono text-muted-foreground"
          style={{ height: rowH }}
        >
          {label}
        </span>
      )}

      {/* Seats */}
      <div className="flex items-end" style={{ gap: 0 }}>
        {row.seats.map((seat, si) => (
          <div key={seat.id} className="flex items-end" style={{ gap: 0 }}>
            <AisleOrGap
              si={si} aisles={aisles} mode={mode}
              colGap={colGap} rowH={rowH} onToggle={onToggleAisle}
            />
            <SeatCell
              seat={seat} mode={mode}
              isEditSelected={selected.has(seat.id)}
              isPvBooked={pvBooked.has(seat.id)}
              isPvSelected={pvSelected.has(seat.id)}
              onToggleSelect={() => onToggleSelect(seat.id)}
              onRemove={() => onRemoveSeat(seat.id)}
              onPvSelect={() => onPvSelect(seat.id)}
              rowLabel={label} colIdx={si}
            />
          </div>
        ))}
      </div>

      {/* Remove row button (edit only) */}
      {mode === 'edit' && (
        <button
          onClick={() => onRemoveRow(row.id)}
          className="ml-2 w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          style={{ height: rowH }}
          title="Remove row"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Main TheatreLayoutBuilder ──
interface TheatreLayoutBuilderProps {
  onSave?: (data: { layout: LayoutItem[]; aisles: number[] }) => void
}

export default function TheatreLayoutBuilder({ onSave }: TheatreLayoutBuilderProps) {
  const state = useTheatreState()
  const {
    layout, aisles, activeType, selected, mode, rowGap, colGap,
    pvBooked, pvSelected, pvTotal, stats,
    setRowGap, setColGap, setSelected,
    enterPreview, enterEdit,
    addSection, addRow, copyLastRow,
    addColumn, removeColumn, removeSeat,
    toggleSelected, selectRow, deleteSelected, assignType,
    toggleAisle, updateSection, removeSection, removeRow,
    togglePvSelected, setActiveTypeAndAssign, undo,
  } = state

  // Compute row index (only counting kind=row items)
  const rowIndices = useMemo(() => {
    const map = new Map<number, number>()
    let idx = 0
    for (const item of layout) {
      if (item.kind === 'row') { map.set(item.id, idx); idx++ }
    }
    return map
  }, [layout])

  const handleSave = useCallback(() => {
    onSave?.({ layout, aisles: [...aisles] })
  }, [onSave, layout, aisles])

  return (
    <div className="select-none font-mono bg-[#F4F2EE] dark:bg-[#1C1C1A] rounded-xl border border-border p-4 flex flex-col gap-3 max-w-full">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">Theatre Layout Builder</h2>

        {/* Mode toggle */}
        <div className="flex bg-muted rounded-lg p-0.5">
          <Button
            variant={mode === 'edit' ? 'default' : 'ghost'}
            size="xs"
            onClick={enterEdit}
            className={mode === 'edit' ? 'shadow-sm' : ''}
          >
            Edit
          </Button>
          <Button
            variant={mode === 'preview' ? 'default' : 'ghost'}
            size="xs"
            onClick={enterPreview}
            className={mode === 'preview' ? 'shadow-sm' : ''}
          >
            Preview
          </Button>
        </div>
      </div>

      {/* ── Toolbar (Edit only) ── */}
      {mode === 'edit' && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type pills */}
          {SEAT_TYPES.map(t => {
            const cfg = SEAT_CONFIG[t]
            const isActive = activeType === t
            const dark = isDarkMode()
            return (
              <button
                key={t}
                onClick={() => setActiveTypeAndAssign(t)}
                style={isActive ? {
                  backgroundColor: dark ? cfg.darkBg : cfg.bg,
                  border: `1.5px solid ${dark ? cfg.darkBorder : cfg.border}`,
                  color: dark ? '#e0e0e0' : '#333',
                } : {}}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? ''
                    : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80'
                }`}
              >
                {t}
              </button>
            )
          })}

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button variant="outline" size="xs" onClick={() => addSection()}>＋ Section</Button>
          <Button variant="outline" size="xs" onClick={() => addRow()}>＋ Row</Button>
          <Button variant="outline" size="xs" onClick={copyLastRow}>⎘ Copy</Button>
          <Button variant="outline" size="xs" onClick={addColumn}>＋ Col</Button>
          <Button variant="outline" size="xs" onClick={removeColumn}>－ Col</Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Row gap slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Row</span>
            <input
              type="range" min={4} max={28} value={rowGap}
              onChange={(e) => setRowGap(Number(e.target.value))}
              className="w-16 h-1 accent-primary"
            />
            <span className="text-[10px] text-muted-foreground w-4">{rowGap}</span>
          </div>

          {/* Col gap slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Col</span>
            <input
              type="range" min={2} max={14} value={colGap}
              onChange={(e) => setColGap(Number(e.target.value))}
              className="w-16 h-1 accent-primary"
            />
            <span className="text-[10px] text-muted-foreground w-4">{colGap}</span>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button variant="ghost" size="xs" onClick={undo}>↩ Undo</Button>

          {onSave && (
            <Button variant="default" size="xs" onClick={handleSave} className="ml-auto">
              Save layout
            </Button>
          )}
        </div>
      )}

      {/* ── Selection action bar ── */}
      {mode === 'edit' && selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-3 py-1.5 rounded-lg bg-[#EAF0FF] dark:bg-[#1a2540] border border-[#A4BEEA] dark:border-[#3a5080] text-xs">
          <span className="font-medium text-[#3366BB]">✓ {selected.size} seat(s) selected</span>
          {SEAT_TYPES.map(t => (
            <Button key={t} variant="ghost" size="xs" onClick={() => assignType(t)} className="text-xs">
              → {t.charAt(0) + t.slice(1).toLowerCase()}
            </Button>
          ))}
          <Button variant="ghost" size="xs" onClick={deleteSelected} className="text-xs text-destructive">
            🗑 Remove
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setSelected(new Set())} className="ml-auto text-xs">
            Clear
          </Button>
        </div>
      )}

      {/* ── Layout area (scrollable) — reversed so back rows are on top, screen at bottom ── */}
      <div className="overflow-x-auto py-2">
        <div className="flex flex-col items-center" style={{ gap: rowGap }}>
          {layout.map((item) => {
            if (item.kind === 'section') {
              return (
                <SectionHeader
                  key={`sec-${item.id}`}
                  section={item}
                  mode={mode}
                  onUpdate={(f, v) => updateSection(item.id, f, v)}
                  onRemove={() => removeSection(item.id)}
                  onAddRow={() => addRow(item.id)}
                />
              )
            }
            const row = item as RowItem
            const ri = rowIndices.get(row.id) ?? 0
            return (
              <RowRenderer
                key={`row-${row.id}`}
                row={row} rowIndex={ri} mode={mode}
                aisles={aisles} colGap={colGap}
                selected={selected} pvBooked={pvBooked} pvSelected={pvSelected}
                onToggleSelect={toggleSelected} onRemoveSeat={removeSeat}
                onPvSelect={togglePvSelected} onSelectRow={selectRow}
                onRemoveRow={removeRow} onToggleAisle={toggleAisle}
              />
            )
          })}
        </div>
      </div>

      {/* ── Screen indicator (at bottom = front of cinema) ── */}
      <div className="flex flex-col items-center gap-0.5 mb-1">
        <span className="text-[10px] tracking-[4px] text-muted-foreground font-medium">SCREEN</span>
        <div className="h-1 w-full rounded-full bg-[#4A7BE0]" />
      </div>

      {/* ── Preview info bar ── */}
      {mode === 'preview' && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-xs">
          <div className="flex items-center gap-3">
            {SEAT_TYPES.map(t => {
              const dark = isDarkMode()
              const bg = dark ? SEAT_CONFIG[t].darkBg : SEAT_CONFIG[t].bg
              return (
                <div key={t} className="flex items-center gap-1">
                  <div style={{ width: 12, height: 10, borderRadius: 2, backgroundColor: bg }} />
                  <span className="text-muted-foreground">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-1">
              <div
                style={{
                  width: 12, height: 10, borderRadius: 2,
                  backgroundColor: isDarkMode() ? SEAT_CONFIG.SILVER.darkBg : SEAT_CONFIG.SILVER.bg,
                  opacity: 0.2,
                }}
              />
              <span className="text-muted-foreground">Taken</span>
            </div>
          </div>
          {pvSelected.size > 0 && (
            <span className="font-medium text-foreground">{pvSelected.size} seat(s) · ₹{pvTotal}</span>
          )}
        </div>
      )}

      {/* ── Stats footer ── */}
      <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-muted-foreground border-t border-border">
        <div className="flex gap-4">
          <span>Rows <strong className="text-foreground">{stats.rows}</strong></span>
          <span>Total <strong className="text-foreground">{stats.total}</strong></span>
          <span>Silver <strong className="text-foreground">{stats.silver}</strong></span>
          <span>Gold <strong className="text-foreground">{stats.gold}</strong></span>
          <span>Executive <strong className="text-foreground">{stats.exec}</strong></span>
          <span>Recliner <strong className="text-foreground">{stats.recl}</strong></span>
        </div>
        {mode === 'edit' && (
          <span className="text-[10px] italic">Click row label to select row · Hover between seats to add aisle</span>
        )}
      </div>
    </div>
  )
}
