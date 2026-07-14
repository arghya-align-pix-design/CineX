import { getScreen } from '../../services/vendorApi'
import { mkSeat, mkRow, createSeedLayout } from './constants'
import type { LayoutItem, SeatType, Zone } from './constants'

export async function loadLayout(
  screenId: number,
): Promise<{
  layout: LayoutItem[]
  colAisles: Set<number>
  rowAisles: Set<number>
  zones: Zone[]
  rowGap: number
  colGap: number
}> {
  const screen = await getScreen(screenId)
  
  if (!screen.screenLayout || !screen.screenLayout.rows || screen.screenLayout.rows.length === 0) {
    // If no layout exists yet, return default seed values
    const seed = createSeedLayout()
    return {
      layout: seed.layout,
      colAisles: seed.aisles,
      rowAisles: new Set<number>(),
      zones: seed.zones,
      rowGap: 10,
      colGap: 6,
    }
  }

  const { rows, zones, aisles, meta } = screen.screenLayout

  const layout: LayoutItem[] = []
  
  rows.forEach(r => {
    const seats = (r.seats || []).map(s => {
      const seat = mkSeat(r.zone as SeatType, s.code)
      // Override default unique ID if necessary or let mkSeat do it
      seat.removed = s.status === 'REMOVED'
      return seat
    })
    
    layout.push(
      mkRow(r.rowLabel, r.zone, seats)
    )
  })

  const colAisles = new Set<number>(aisles?.afterCols || [])
  const rowAisles = new Set<number>(aisles?.afterRows || [])

  return {
    layout,
    colAisles,
    rowAisles,
    zones: zones || [],
    rowGap: meta?.rowGap ?? 10,
    colGap: meta?.colGap ?? 6,
  }
}
