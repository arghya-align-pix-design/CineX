import { useState, useCallback, useRef, useEffect } from 'react'
import type { LayoutItem, SeatType, Zone } from './constants'
import {
  mkSeat, mkRow, mkRowWithCodes,
  createSeedLayout, ROW_LABEL,
  DEFAULT_MULTIPLIER, SEAT_CONFIG
} from './constants'

export function useTheatreState() {
  const seed = useRef(createSeedLayout())
  const [layout,     setLayout]     = useState<LayoutItem[]>(seed.current.layout)
  const [colAisles,  setColAisles]  = useState<Set<number>>(seed.current.aisles)
  const [rowAisles,  setRowAisles]  = useState<Set<number>>(new Set())
  const [zones,      setZones]      = useState<Zone[]>(seed.current.zones)
  const [activeType, setActiveType] = useState<SeatType>('SILVER')
  const [selected,   setSelected]   = useState<Set<number>>(new Set())
  const [mode,       setMode]       = useState<'edit' | 'preview'>('edit')
  const [rowGap,     setRowGap]     = useState(10)
  const [colGap,     setColGap]     = useState(6)
  const [pvBooked,   setPvBooked]   = useState<Set<number>>(new Set())
  const [pvSelected, setPvSelected] = useState<Set<number>>(new Set())

  const historyRef = useRef<string[]>([])
  const [, forceUpdate] = useState(0)

  const saveHistory = useCallback(() => {
    const s = JSON.stringify({
      layout,
      colAisles: [...colAisles],
      rowAisles: [...rowAisles],
      zones
    })
    historyRef.current = [...historyRef.current.slice(-39), s]
  }, [layout, colAisles, rowAisles, zones])

  const undo = useCallback(() => {
    const h = historyRef.current
    if (!h.length) return
    const snap = JSON.parse(h[h.length - 1])
    setLayout(snap.layout)
    setColAisles(new Set(snap.colAisles))
    setRowAisles(new Set(snap.rowAisles))
    setZones(snap.zones)
    setSelected(new Set())
    historyRef.current = h.slice(0, -1)
    forceUpdate(n => n + 1)
  }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [undo])

  // ── Preview ──
  const enterPreview = useCallback(() => {
    setSelected(new Set())
    setPvSelected(new Set())
    const allSeats: number[] = []
    for (const item of layout) {
      for (const s of item.seats) {
        if (!s.removed) allSeats.push(s.id)
      }
    }
    const count    = Math.round(allSeats.length * 0.27)
    const shuffled = [...allSeats].sort(() => Math.random() - 0.5)
    setPvBooked(new Set(shuffled.slice(0, count)))
    setMode('preview')
  }, [layout])

  const enterEdit = useCallback(() => setMode('edit'), [])

  // ── Sequentially Relabel Rows ──
  const relabelRows = useCallback(() => {
    saveHistory()
    setLayout(l => l.map((row, ri) => {
      const newLabel = ROW_LABEL(ri)
      const seats = row.seats.map((seat, ci) => ({
        ...seat,
        code: `${newLabel}${ci + 1}`
      }))
      return { ...row, rowLabel: newLabel, seats }
    }))
  }, [saveHistory])

  // ── Mutations ──
  const addRow = useCallback((zoneType: SeatType = activeType) => {
    saveHistory()
    const cols = layout.length > 0 ? layout[layout.length - 1].seats.length : 12
    const globalIdx = layout.length
    const newRow = mkRowWithCodes(zoneType, cols, globalIdx)
    setLayout(l => [...l, newRow])
  }, [layout, activeType, saveHistory])

  const copyLastRow = useCallback(() => {
    if (layout.length === 0) return
    saveHistory()
    setLayout(l => {
      const src = l[l.length - 1]
      const newGlobal = l.length
      const label = ROW_LABEL(newGlobal)
      const seats = src.seats.map((s, ci) => ({
        ...mkSeat(s.type, `${label}${ci + 1}`),
        removed: s.removed
      }))
      const newRow = mkRow(label, src.zone, seats)
      return [...l, newRow]
    })
  }, [layout, saveHistory])

  const removeRow = useCallback((id: number) => {
    saveHistory()
    setLayout(l => {
      const row = l.find(i => i.id === id)
      if (row) {
        setSelected(prev => {
          const next = new Set(prev)
          row.seats.forEach(s => next.delete(s.id))
          return next
        })
      }
      return l.filter(i => i.id !== id)
    })
  }, [saveHistory])

  const addColumn = useCallback(() => {
    saveHistory()
    setLayout(l => l.map(row => {
      const firstType = row.seats.find(s => !s.removed)?.type ?? activeType
      const newCode = `${row.rowLabel}${row.seats.length + 1}`
      if (row.seats.length >= 25) return row // Guard: max 25 cols
      return { ...row, seats: [...row.seats, mkSeat(firstType, newCode)] }
    }))
  }, [activeType, saveHistory])

  const removeColumn = useCallback(() => {
    saveHistory()
    setLayout(l => l.map(row => {
      if (row.seats.length === 0) return row
      const dropped = row.seats[row.seats.length - 1]
      setSelected(prev => { const n = new Set(prev); n.delete(dropped.id); return n })
      return { ...row, seats: row.seats.slice(0, -1) }
    }))
  }, [saveHistory])

  const removeSeat = useCallback((seatId: number) => {
    saveHistory()
    setSelected(prev => { const n = new Set(prev); n.delete(seatId); return n })
    setLayout(l => l.map(row => ({
      ...row,
      seats: row.seats.map(s => s.id === seatId ? { ...s, removed: true } : s)
    })))
  }, [saveHistory])

  const toggleSelected = useCallback((seatId: number) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(seatId) ? n.delete(seatId) : n.add(seatId)
      return n
    })
  }, [])

  const selectRow = useCallback((rowId: number) => {
    const row = layout.find(i => i.id === rowId)
    if (!row) return
    const nonRemoved  = row.seats.filter(s => !s.removed).map(s => s.id)
    const allSelected = nonRemoved.every(id => selected.has(id))
    setSelected(prev => {
      const n = new Set(prev)
      nonRemoved.forEach(id => allSelected ? n.delete(id) : n.add(id))
      return n
    })
  }, [layout, selected])

  const deleteSelected = useCallback(() => {
    saveHistory()
    setLayout(l => l.map(row => ({
      ...row,
      seats: row.seats.map(s => selected.has(s.id) ? { ...s, removed: true } : s)
    })))
    setSelected(new Set())
  }, [selected, saveHistory])

  const assignType = useCallback((type: SeatType) => {
    if (selected.size === 0) return
    saveHistory()
    setLayout(l => l.map(row => ({
      ...row,
      seats: row.seats.map(s => selected.has(s.id) ? { ...s, type } : s)
    })))
  }, [selected, saveHistory])

  const toggleAisle = useCallback((colIdx: number) => {
    saveHistory()
    setColAisles(prev => {
      const n = new Set(prev)
      n.has(colIdx) ? n.delete(colIdx) : n.add(colIdx)
      return n
    })
  }, [saveHistory])

  const toggleRowAisle = useCallback((rowIdx: number) => {
    saveHistory()
    setRowAisles(prev => {
      const n = new Set(prev)
      n.has(rowIdx) ? n.delete(rowIdx) : n.add(rowIdx)
      return n
    })
  }, [saveHistory])

  const updateZoneMultiplier = useCallback((zoneType: string, newMultiplier: number) => {
    saveHistory()
    setZones(prev => prev.map(z => z.type === zoneType ? { ...z, priceMultiplier: newMultiplier } : z))
  }, [saveHistory])

  const updateZoneName = useCallback((zoneType: string, newName: string) => {
    saveHistory()
    setZones(prev => prev.map(z => z.type === zoneType ? { ...z, name: newName } : z))
  }, [saveHistory])

  const addCustomZone = useCallback((zoneType: SeatType) => {
    if (zones.some(z => z.type === zoneType)) return
    saveHistory()
    const newZone: Zone = {
      name: zoneType.charAt(0) + zoneType.slice(1).toLowerCase(),
      type: zoneType,
      priceMultiplier: DEFAULT_MULTIPLIER[zoneType],
      color: SEAT_CONFIG[zoneType].color
    }
    setZones(prev => [...prev, newZone])
  }, [zones, saveHistory])

  const removeCustomZone = useCallback((zoneType: string) => {
    saveHistory()
    setZones(prev => prev.filter(z => z.type !== zoneType))
    // Reset any rows using this zone back to SILVER
    setLayout(l => l.map(row => row.zone === zoneType ? { ...row, zone: 'SILVER' } : row))
  }, [saveHistory])

  const toggleRowZone = useCallback((rowId: number, zoneType: string) => {
    saveHistory()
    setLayout(l => l.map(row => {
      if (row.id !== rowId) return row
      // Update the row zone and change all active seats in this row to match the new zone type
      const seats = row.seats.map(s => ({ ...s, type: zoneType as SeatType }))
      return { ...row, zone: zoneType, seats }
    }))
  }, [saveHistory])

  const togglePvSelected = useCallback((seatId: number) => {
    if (pvBooked.has(seatId)) return
    setPvSelected(prev => {
      const n = new Set(prev)
      n.has(seatId) ? n.delete(seatId) : n.add(seatId)
      return n
    })
  }, [pvBooked])

  const setActiveTypeAndAssign = useCallback((type: SeatType) => {
    setActiveType(type)
    // Add zone to active zones list if not already present
    addCustomZone(type)
    if (selected.size > 0) {
      saveHistory()
      setLayout(l => l.map(row => ({
        ...row,
        seats: row.seats.map(s => selected.has(s.id) ? { ...s, type } : s)
      })))
    }
  }, [selected, addCustomZone, saveHistory])

  // ── Stats ──
  const stats = (() => {
    let rowCount = 0, total = 0, silver = 0, gold = 0, exec = 0,
        balcony = 0, platinum = 0, recl = 0
    for (const row of layout) {
      rowCount++
      for (const s of row.seats) {
        if (s.removed) continue
        total++
        if      (s.type === 'SILVER')    silver++
        else if (s.type === 'GOLD')      gold++
        else if (s.type === 'EXECUTIVE') exec++
        else if (s.type === 'BALCONY')   balcony++
        else if (s.type === 'PLATINUM')  platinum++
        else                             recl++
      }
    }
    return { rows: rowCount, total, silver, gold, exec, balcony, platinum, recl }
  })()

  // ── Preview multiplier total ──
  const pvTotal = (() => {
    if (pvSelected.size === 0) return 0
    let total = 0
    // Create multipliers lookup
    const multLookup: Record<string, number> = {}
    zones.forEach(z => {
      multLookup[z.type] = z.priceMultiplier
    })

    for (const row of layout) {
      const currentMult = multLookup[row.zone] ?? 1.0
      for (const s of row.seats) {
        if (pvSelected.has(s.id) && !pvBooked.has(s.id) && !s.removed) {
          total += currentMult * 100 // base price ₹100
        }
      }
    }
    return Math.round(total)
  })()

  return {
    layout, colAisles, rowAisles, zones, activeType, selected, mode, rowGap, colGap,
    pvBooked, pvSelected, pvTotal, stats,
    setRowGap, setColGap, setSelected, setLayout, setColAisles, setRowAisles, setZones,
    enterPreview, enterEdit,
    addRow, copyLastRow, removeRow,
    addColumn, removeColumn, removeSeat,
    toggleSelected, selectRow, deleteSelected, assignType,
    toggleAisle, toggleRowAisle, relabelRows,
    updateZoneMultiplier, updateZoneName, addCustomZone, removeCustomZone, toggleRowZone,
    togglePvSelected, setActiveTypeAndAssign, undo,
  }
}