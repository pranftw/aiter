import { createContext, useContext } from 'react'
import { ChatContainer } from './chat/container'
import { ChatMessages } from './chat/messages'
import { ChatBox } from './chat/box'
import { AIMessage } from './chat/message/ai'
import { UserMessage } from './chat/message/user'

export const coreComponents = {
  ChatContainer,
  ChatMessages,
  ChatBox,
  AIMessage,
  UserMessage,
}

export type CoreComponentsMap = typeof coreComponents
export type CustomComponents = Partial<CoreComponentsMap>

const ComponentsContext = createContext<CoreComponentsMap>(coreComponents)

export function useComponents() {
  return useContext(ComponentsContext)
}

export const ComponentsProvider = ComponentsContext.Provider

