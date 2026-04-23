import { AutoFuel } from '../tools/auto-fuel'
import type { Tile } from '../utils/tile'

export function enhanceFlightControlTile(tile: Tile) {
  const autoFuel = new AutoFuel(tile)
  autoFuel.attach()
}
