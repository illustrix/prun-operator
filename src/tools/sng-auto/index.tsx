import { type CSSProperties, type FC, useState } from 'react'
import { Modal } from '../../components/Modal'
import { waitForElement } from '../../utils/selector'
import { useTool } from '../base/context'
import { Tool } from '../base/tool'

export interface SngBase {
  address: string
  name?: string
  needsSupply: boolean
  needsSubmit: boolean
}

const triggerButtonStyle: CSSProperties = {
  padding: '2px 8px',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '4px 8px',
  borderBottom: '1px solid #374151',
  color: '#9ca3af',
  fontWeight: 500,
}

const tdStyle: CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #1f2937',
}

const badgeBase: CSSProperties = {
  display: 'inline-block',
  padding: '1px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
}

const okBadge: CSSProperties = {
  ...badgeBase,
  color: '#34d399',
  backgroundColor: '#064e3b',
}

const warnBadge: CSSProperties = {
  ...badgeBase,
  color: '#fbbf24',
  backgroundColor: '#78350f',
}

const StatusBadge: FC<{ flag: boolean; warn: string; ok: string }> = ({
  flag,
  warn,
  ok,
}) => <span style={flag ? warnBadge : okBadge}>{flag ? warn : ok}</span>

const SngModal: FC = () => {
  const tool = useTool<SngAutoTool>()
  const [open, setOpen] = useState(false)
  const [bases, setBases] = useState<SngBase[]>([])

  return (
    <>
      <button
        type="button"
        style={triggerButtonStyle}
        onClick={() => {
          setBases(tool.collectBases())
          setOpen(true)
        }}
      >
        SNG Auto
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="SNG Bases">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Base</th>
              <th style={thStyle}>Supply</th>
              <th style={thStyle}>Submit</th>
            </tr>
          </thead>
          <tbody>
            {bases.length === 0 ? (
              <tr>
                <td style={{ ...tdStyle, color: '#9ca3af' }} colSpan={3}>
                  No SNG bases detected.
                </td>
              </tr>
            ) : (
              bases.map(b => (
                <tr key={b.address}>
                  <td style={tdStyle}>{b.name ?? b.address}</td>
                  <td style={tdStyle}>
                    <StatusBadge
                      flag={b.needsSupply}
                      warn="Need Supply"
                      ok="OK"
                    />
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge
                      flag={b.needsSubmit}
                      warn="Need Submit"
                      ok="OK"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Modal>
    </>
  )
}

export class SngAutoTool extends Tool {
  override match() {}

  protected override getContainer() {
    return waitForElement(this.tile.el, '[class*="ActionBar__container"]')
  }

  override render() {
    return <SngModal />
  }

  collectBases(): SngBase[] {
    // TODO: enumerate connected SNG bases from the CONTD tile and derive
    // their supply / submission status.
    return []
  }
}
