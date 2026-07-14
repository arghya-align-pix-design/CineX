import { saveScreenLayout } from '../../services/vendorApi'
import type { LayoutItem, Zone } from './constants'

export async function saveLayout(
  screenId:  number,
  layout:    LayoutItem[],
  colAisles: Set<number>,
  rowAisles: Set<number>,
  zones:     Zone[],
  rowGap:    number,
  colGap:    number,
): Promise<void> {
  const rows = layout.map((row, ri) => {
    const seats = row.seats.map((seat, ci) => ({
      col: ci + 1,
      code: seat.code,
      status: seat.removed ? ('REMOVED' as const) : ('ACTIVE' as const)
    }))
    return {
      rowLabel: row.rowLabel,
      rowOrder: ri,
      zone: row.zone,
      seats
    }
  })

  const maxCols = layout.reduce((max, r) => Math.max(max, r.seats.length), 0)
  
  let totalActiveSeats = 0
  rows.forEach(r => {
    r.seats.forEach(s => {
      if (s.status === 'ACTIVE') totalActiveSeats++
    })
  })

  const payload = {
    rows,
    zones,
    aisles: {
      afterRows: Array.from(rowAisles),
      afterCols: Array.from(colAisles)
    },
    meta: {
      maxCols,
      rowGap,
      colGap,
      totalActiveSeats
    }
  }

  await saveScreenLayout(screenId, payload)
}
