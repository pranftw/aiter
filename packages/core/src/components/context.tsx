import { createContext, useContext } from 'react'
import * as coreComponents from '@aiter/core/components'

export type CoreComponentsMap = typeof coreComponents
export type CustomComponents = Partial<CoreComponentsMap>

const ComponentsContext = createContext<CoreComponentsMap>(coreComponents)

export function useComponents() {
  return useContext(ComponentsContext)
}

export const ComponentsProvider = ComponentsContext.Provider

