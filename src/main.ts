import { scanTiles } from './tiles'

const observer = new MutationObserver(scanTiles)
observer.observe(document.body, { childList: true, subtree: true })

scanTiles()

console.log('PrUn Operator loaded')
