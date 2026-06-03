import { useState, useCallback, useRef, useEffect } from 'react'
import type { LayoutItem, SeatType, RowItem, SectionItem } from './constants'
import {
  mkSeat, mkRow, mkSection, mkRowWithCodes,
  createSeedLayout, SEAT_TYPES, ROW_LABEL,
} from './constants'

// ── Helper: count rows before a given layout index (= global row index at that position) ──
function globalRowsBefore(layout: LayoutItem[], beforeIdx: number): number {
  let count = 0
  for (let i = 0; i < beforeIdx; i++) {
    if (layout[i].kind === 'row') count++
  }
  return count
}

export function useTheatreState() {
  const seed = useRef(createSeedLayout())
  const [layout,     setLayout]     = useState<LayoutItem[]>(seed.current.layout)
  const [aisles,     setAisles]     = useState<Set<number>>(seed.current.aisles)
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
    const s = JSON.stringify({ layout, aisles: [...aisles] })
    historyRef.current = [...historyRef.current.slice(-39), s]
  }, [layout, aisles])

  const undo = useCallback(() => {
    const h = historyRef.current
    if (!h.length) return
    const snap = JSON.parse(h[h.length - 1])
    setLayout(snap.layout)
    setAisles(new Set(snap.aisles))
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
      if (item.kind === 'row') {
        for (const s of item.seats) {
          if (!s.removed) allSeats.push(s.id)
        }
      }
    }
    const count    = Math.round(allSeats.length * 0.27)
    const shuffled = [...allSeats].sort(() => Math.random() - 0.5)
    setPvBooked(new Set(shuffled.slice(0, count)))
    setMode('preview')
  }, [layout])

  const enterEdit = useCallback(() => setMode('edit'), [])

  // ── Mutations ──

  const addSection = useCallback(() => {
    saveHistory()
    const used = new Set(
      layout.filter((i): i is SectionItem => i.kind === 'section').map(s => s.seatType)
    )
    const type = SEAT_TYPES.find(t => !used.has(t)) ?? 'SILVER'
    setLayout(l => [...l, mkSection(type)])
  }, [layout, saveHistory])

  const addRow = useCallback((sectionId?: number) => {
    saveHistory()
    const rows = layout.filter((i): i is RowItem => i.kind === 'row')
    const n    = rows.length > 0 ? rows[rows.length - 1].seats.length : 12

    setLayout(l => {
      if (sectionId !== undefined) {
        const secIdx = l.findIndex(i => i.kind === 'section' && i.id === sectionId)
        if (secIdx === -1) return l
        const sec = l[secIdx] as SectionItem
        let insertIdx = secIdx + 1
        while (insertIdx < l.length && l[insertIdx].kind === 'row') insertIdx++
        const globalIdx = globalRowsBefore(l, insertIdx)
        const newRow    = mkRowWithCodes(sec.seatType, n, globalIdx)
        return [...l.slice(0, insertIdx), newRow, ...l.slice(insertIdx)]
      }
      // Append to end
      const sections  = l.filter((i): i is SectionItem => i.kind === 'section')
      const type      = sections.length > 0 ? sections[sections.length - 1].seatType : activeType
      const globalIdx = globalRowsBefore(l, l.length)
      return [...l, mkRowWithCodes(type, n, globalIdx)]
    })
  }, [layout, activeType, saveHistory])

  const copyLastRow = useCallback(() => {
    saveHistory()
    setLayout(l => {
      const lastRowIdx = l
        .map((item, i) => (item.kind === 'row' ? i : -1))
        .filter(i => i >= 0)
        .pop()
      if (lastRowIdx === undefined) return l

      const src        = l[lastRowIdx] as RowItem
      const newGlobal  = globalRowsBefore(l, lastRowIdx + 1)
      const label      = ROW_LABEL(newGlobal)

      // Copy seats with updated codes for new row label; preserve removed flag
      const seats = src.seats.map((s, ci) =>
        ({ ...mkSeat(s.type, `${label}${ci + 1}`), removed: s.removed })
      )
      const newRow = mkRow(seats)
      return [...l.slice(0, lastRowIdx + 1), newRow, ...l.slice(lastRowIdx + 1)]
    })
  }, [saveHistory])

  const removeRow = useCallback((id: number) => {
    saveHistory()
    setLayout(l => {
      const row = l.find(i => i.kind === 'row' && i.id === id) as RowItem | undefined
      if (row) {
        setSelected(prev => {
          const next = new Set(prev)
          row.seats.forEach(s => next.delete(s.id))
          return next
        })
      }
      return l.filter(i => !(i.kind === 'row' && i.id === id))
    })
  }, [saveHistory])

  const addColumn = useCallback(() => {
    saveHistory()
    setLayout(l => {
      let rowIdx = 0
      return l.map(item => {
        if (item.kind !== 'row') return item
        const firstType = item.seats.find(s => !s.removed)?.type ?? activeType
        const label     = ROW_LABEL(rowIdx)
        const newCode   = `${label}${item.seats.length + 1}`
        rowIdx++
        // Guard: max 25 columns
        if (item.seats.length >= 25) return item
        return { ...item, seats: [...item.seats, mkSeat(firstType, newCode)] }
      })
    })
  }, [activeType, saveHistory])

  const removeColumn = useCallback(() => {
    saveHistory()
    setLayout(l => l.map(item => {
      if (item.kind !== 'row' || item.seats.length === 0) return item
      const dropped = item.seats[item.seats.length - 1]
      setSelected(prev => { const n = new Set(prev); n.delete(dropped.id); return n })
      return { ...item, seats: item.seats.slice(0, -1) }
    }))
  }, [saveHistory])

  const removeSeat = useCallback((seatId: number) => {
    saveHistory()
    setSelected(prev => { const n = new Set(prev); n.delete(seatId); return n })
    setLayout(l => l.map(item => {
      if (item.kind !== 'row') return item
      return { ...item, seats: item.seats.map(s => s.id === seatId ? { ...s, removed: true } : s) }
    }))
  }, [saveHistory])

  const toggleSelected = useCallback((seatId: number) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(seatId) ? n.delete(seatId) : n.add(seatId)
      return n
    })
  }, [])

  const selectRow = useCallback((rowId: number) => {
    const row = layout.find(i => i.kind === 'row' && i.id === rowId) as RowItem | undefined
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
    setLayout(l => l.map(item => {
      if (item.kind !== 'row') return item
      return { ...item, seats: item.seats.map(s => selected.has(s.id) ? { ...s, removed: true } : s) }
    }))
    setSelected(new Set())
  }, [selected, saveHistory])

  const assignType = useCallback((type: SeatType) => {
    if (selected.size === 0) return
    saveHistory()
    setLayout(l => l.map(item => {
      if (item.kind !== 'row') return item
      return { ...item, seats: item.seats.map(s => selected.has(s.id) ? { ...s, type } : s) }
    }))
  }, [selected, saveHistory])

  const toggleAisle = useCallback((colIdx: number) => {
    saveHistory()
    setAisles(prev => {
      const n = new Set(prev)
      n.has(colIdx) ? n.delete(colIdx) : n.add(colIdx)
      return n
    })
  }, [saveHistory])

  const updateSection = useCallback((id: number, field: string, value: string | number) => {
    setLayout(l => l.map(item => {
      if (item.kind !== 'section' || item.id !== id) return item
      return { ...item, [field]: value }
    }))
  }, [])

  const removeSection = useCallback((id: number) => {
    saveHistory()
    setLayout(l => l.filter(i => !(i.kind === 'section' && i.id === id)))
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
    if (selected.size > 0) {
      saveHistory()
      setLayout(l => l.map(item => {
        if (item.kind !== 'row') return item
        return { ...item, seats: item.seats.map(s => selected.has(s.id) ? { ...s, type } : s) }
      }))
    }
  }, [selected, saveHistory])

  // ── Stats ──
  const stats = (() => {
    let rows = 0, total = 0, silver = 0, gold = 0, exec = 0,
        balcony = 0, platinum = 0, recl = 0
    for (const item of layout) {
      if (item.kind === 'row') {
        rows++
        for (const s of item.seats) {
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
    }
    return { rows, total, silver, gold, exec, balcony, platinum, recl }
  })()

  // ── Preview multiplier total ──
  // basePrice lives on the Show, not here — so we sum priceMultiplier * 100 as a
  // placeholder. Replace 100 with actual basePrice when show context is available.
  const pvTotal = (() => {
    if (pvSelected.size === 0) return 0
    let total          = 0
    let currentMult    = 1.0
    for (const item of layout) {
      if (item.kind === 'section') currentMult = item.priceMultiplier
      if (item.kind === 'row') {
        for (const s of item.seats) {
          if (pvSelected.has(s.id) && !pvBooked.has(s.id) && !s.removed)
            total += currentMult * 100   // placeholder base ₹100
        }
      }
    }
    return Math.round(total)
  })()

  return {
    layout, aisles, activeType, selected, mode, rowGap, colGap,
    pvBooked, pvSelected, pvTotal, stats,
    setRowGap, setColGap, setSelected,
    enterPreview, enterEdit,
    addSection, addRow, copyLastRow, removeRow,
    addColumn, removeColumn, removeSeat,
    toggleSelected, selectRow, deleteSelected, assignType,
    toggleAisle, updateSection, removeSection,
    togglePvSelected, setActiveTypeAndAssign, undo,
  }
}