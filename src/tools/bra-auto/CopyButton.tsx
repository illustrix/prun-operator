import { type FC, useState } from 'react'
import { type Station, stations } from '../../utils/stations'
import { useTool } from '../base/context'
import styles from './CopyButton.module.css'
import type { BuildingRepairAssistantAuto } from './index'

export const CopyButton: FC = () => {
  const tool = useTool<BuildingRepairAssistantAuto>()
  const [stationCode, setStationCode] = useState(stations[0]?.code)
  const [status, setStatus] = useState<{
    text: string
    error?: boolean
  } | null>(null)

  const onClick = async () => {
    const station = stations.find(s => s.code === stationCode) as Station
    try {
      const items = tool.parseMaterials()
      if (items.length === 0) {
        setStatus({ text: 'No materials.', error: true })
      } else {
        await tool.copyXitAct(items, station)
        setStatus({ text: `Copied (${items.length} items)` })
      }
    } catch (err) {
      console.error('Copy repair XIT failed', err)
      setStatus({
        text: err instanceof Error ? err.message : String(err),
        error: true,
      })
    }
    setTimeout(() => setStatus(null), 2000)
  }

  return (
    <>
      <div>
        <span>Copy XIT</span>
      </div>
      <div className={styles.controls}>
        <select
          className={styles.select}
          value={stationCode}
          onChange={e => setStationCode(e.target.value)}
          aria-label="Station"
        >
          {stations.map(s => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="button" className={styles.button} onClick={onClick}>
          Copy
        </button>
        {status && (
          <span
            className={`${styles.status} ${status.error ? styles.statusError : styles.statusOk}`}
          >
            {status.text}
          </span>
        )}
      </div>
    </>
  )
}
