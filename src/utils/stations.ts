export interface Station {
  name: string
  code: string
  warehouse: string
}

export const stations: Station[] = [
  { name: 'Antares', code: 'AI1', warehouse: 'Antares Station Warehouse' },
  { name: 'Benten', code: 'CI1', warehouse: 'Benten Station Warehouse' },
  { name: 'Hortus', code: 'IC1', warehouse: 'Hortus Station Warehouse' },
  { name: 'Moria', code: 'NC1', warehouse: 'Moria Station Warehouse' },
]
