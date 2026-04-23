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
}
