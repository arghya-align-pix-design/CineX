import { mkSeat, mkRow, mkSection, ROW_LABEL, nri, nsec } from './constants'
import type { LayoutItem, SeatType } from './constants'

const BASE = 'http://localhost:9000'

export async function loadLayout(
  theatreId: number,
  token:     string,
): Promise<{ layout: LayoutItem[]; aisles: Set<number> }> {
  const res = await fetch(`${BASE}/theatres/${theatreId}/sections`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load sections (${res.status})`)

  const sections = await res.json()
  const layout: LayoutItem[] = []
  const aisles  = new Set<number>()
  let globalRowIndex = 0

  for (const sec of sections) {
    // Section header
    const sectionItem = mkSection(sec.seatType as SeatType)
    sectionItem.id              = nsec()
    sectionItem.backendId       = sec.id
    sectionItem.name            = sec.name
    sectionItem.priceMultiplier = sec.priceMultiplier
    layout.push(sectionItem)

    const grid       = sec.seatGrid
    const rows: number  = grid.rows
    const cols: number  = grid.columns
    const damaged: string[] = grid.damagedSeats ?? []

    // Restore aisles (use first section's aisles — they're global)
    if (layout.filter(i => i.kind === 'section').length === 1 && grid.aisles?.length) {
      grid.aisles.forEach((a: number) => aisles.add(a))
    }

    for (let r = 0; r < rows; r++) {
      const label = ROW_LABEL(globalRowIndex + r)
      const seats = Array.from({ length: cols }, (_, ci) => {
        const code    = `${label}${ci + 1}`
        const seat    = mkSeat(sec.seatType as SeatType, code)
        seat.removed  = damaged.includes(code)
        return seat
      })
      layout.push({ kind: 'row', id: nri(), seats })
    }

    globalRowIndex += rows
  }

  return { layout, aisles }
}
