import { createContext, type ReactNode, useContext } from 'react'
import type { Tool } from './tool'

const ToolContext = createContext<unknown>(null)

export const provideToolContext = <T extends Tool>(
  tool: T,
  children: ReactNode,
) => {
  return <ToolContext.Provider value={tool}>{children}</ToolContext.Provider>
}

export const useTool = <T extends Tool>(): T => {
  const tool = useContext(ToolContext)
  if (!tool) {
    throw new Error('useTool must be used within a ToolContext.Provider')
  }
  return tool as T
}
