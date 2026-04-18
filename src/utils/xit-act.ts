export const xitActTemplate = {
  actions: [
    {
      group: 'Cart',
      exchange: 'NC1',
      priceLimits: {},
      buyPartial: false,
      useCXInv: true,
      name: 'BuyItems',
      type: 'CX Buy',
    },
    {
      type: 'MTRA',
      name: 'TransferAction',
      group: 'Cart',
      origin: 'Moria Station Warehouse',
      dest: 'Configure on Execution',
    },
  ],
  global: { name: 'PrUn Operator Supply Cart' },
  groups: [
    {
      type: 'Manual',
      name: 'Cart',
      materials: {},
    },
  ],
}
