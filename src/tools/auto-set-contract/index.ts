import type { Tile } from '../../utils/tile'
import { ContractSetter } from './ContractSetter'
import type { AutoSetContractConfig } from './types'

export { ContractSetter } from './ContractSetter'
export type { ContractSetterOptions } from './ContractSetter'
export type { AutoSetContractConfig, ContractItem } from './types'

export async function autoSetContract(
  tile: Tile,
  config: AutoSetContractConfig,
): Promise<void> {
  await new ContractSetter(tile, config).run()
}
