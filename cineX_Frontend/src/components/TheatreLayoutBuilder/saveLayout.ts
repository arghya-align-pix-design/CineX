import type { LayoutItem, SectionItem, RowItem } from './constants'
import { ROW_LABEL } from './constants'

const BASE = 'http://localhost:9000'

export async function saveLayout(
  theatreId: number,
  token:     string,
  layout:    LayoutItem[],
  aisles:    Set<number>,
): Promise<void> {
  // Walk layout, group rows under their section
  type SectionBundle = { section: SectionItem; rows: RowItem[] }
  const bundles: SectionBundle[] = []
  let current: SectionBundle | null = null

  for (const item of layout) {
    if (item.kind === 'section') {
      current = { section: item, rows: [] }
      bundles.push(current)
    } else if (item.kind === 'row' && current) {
      current.rows.push(item)
    }
  }

  // globalRowOffset so row labels are unique across sections
  let globalRowOffset = 0

  for (const { section, rows } of bundles) {
    if (rows.length === 0) { globalRowOffset += 0; continue }

    const cols      = rows[0].seats.length
    const seatCodes: string[] = []
    const damagedSeats: string[] = []

    rows.forEach((row, ri) => {
      const label = ROW_LABEL(globalRowOffset + ri)
      row.seats.forEach((seat, ci) => {
        const code = `${label}${ci + 1}`
        seatCodes.push(code)
        if (seat.removed) damagedSeats.push(code)
      })
    })

    const body = {
      name:            section.name,
      seatType:        section.seatType,
      rows:            rows.length,
      cols,
      priceMultiplier: section.priceMultiplier,
      seatGrid: {
        rows:             rows.length,
        columns:          cols,
        seatCodes,
        damagedSeats,
        unavailableSeats: [],
        aisles:           [...aisles],
      },
    }

    const url    = section.backendId
      ? `${BASE}/theatres/${theatreId}/sections/${section.backendId}`
      : `${BASE}/theatres/${theatreId}/sections`
    const method = section.backendId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Section "${section.name}" failed (${res.status}): ${text}`)
    }

    // On first POST, store the returned id as backendId so next save uses PUT
    if (!section.backendId) {
      const data = await res.json()
      section.backendId = data.id   // mutates the item in layout directly
    }

    globalRowOffset += rows.length
  }
}
