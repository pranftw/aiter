import { createContext, useContext } from 'react'
import * as coreComponents from '@/components'

export type CoreComponentsMap = typeof coreComponents
export type CustomComponents = Record<string, any>

const ComponentsContext = createContext<CoreComponentsMap & CustomComponents>(coreComponents)

export function useComponents() {
  return useContext(ComponentsContext)
}

export const ComponentsProvider = ComponentsContext.Provider
export { coreComponents }

