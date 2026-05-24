export interface ContractItem {
  commodity: string
  amount: number
  price: number
}

export interface AutoSetContractConfig {
  template: string
  currency: string
  location: string
  items: ContractItem[]
  // Deadline in days applied to the contract's conditions. When omitted,
  // the game's default deadline is left untouched.
  deadline?: number
}
