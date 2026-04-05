import { AutoFuel } from '../tools/auto-fuel'

export function enhanceFlightControlTile(tile: Element) {
  const autoFuel = new AutoFuel(tile)
  autoFuel.attach()
}
