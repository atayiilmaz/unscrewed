import { Vector3 } from 'three'
import type { ColorId } from '../game/types'

/** World-space layout of the portrait play field. */
export const LAYOUT = {
  board: { w: 8.6, h: 9.8 },
  boxY: 6.5,
  boxX: 2.2,
  boxSlotGap: 0.78,
  trayY: -6.35,
  traySlotGap: 1.2,
  /** Visible area the camera must always fit. */
  view: { w: 9.6, h: 17.6 },
}

export const plateZ = (layer: number) => 0.12 + layer * 0.26
export const SCREW_Z_ABOVE_PLATE = 0.16

export const COLORS: Record<ColorId, string> = {
  red: '#ff4d5e',
  blue: '#3d8bff',
  yellow: '#ffc928',
  green: '#3fcf6b',
  purple: '#a46bff',
  orange: '#ff8a2b',
}

export const traySlotPos = (i: number, n: number, out = new Vector3()) => out.set((i - (n - 1) / 2) * LAYOUT.traySlotGap, LAYOUT.trayY, 0.35)

/** Live box positions, written by the Boxes component every frame and read by flying screws. */
export const boxAnchors = new Map<number, Vector3>()

export const boxSlotOffset = (slot: number, out = new Vector3()) => out.set((slot - 1) * LAYOUT.boxSlotGap, 0.05, 0.42)

/** How long a screw takes to turn out, shortened by the Power Drill skill. */
export const unscrewSeconds = (speedLevel: number) => 0.3 / (1 + 0.35 * speedLevel)
