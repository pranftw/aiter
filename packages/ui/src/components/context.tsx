import { createContext, useContext } from 'react'
import { ChatContainer } from './chat/container'
import { ChatMessages } from './chat/messages'
import { ChatBox } from './chat/box'
import { AIMessage } from './chat/message/ai'
import { UserMessage } from './chat/message/user'
import { StatusIndicator } from './status-indicator'
import { ErrorOverlay } from './triggers/core/error-overlay'
import { TriggerWindow } from './triggers/core/trigger-window'
import { CommandSuggestions } from './triggers/commands/suggestions'

export const coreComponents = {
  ChatContainer,
  ChatMessages,
  ChatBox,
  AIMessage,
  UserMessage,
  StatusIndicator,
  ErrorOverlay,
  TriggerWindow,
  CommandSuggestions,
}

export type CoreComponentsMap = typeof coreComponents
export type CustomComponents = Partial<CoreComponentsMap>

const ComponentsContext = createContext<CoreComponentsMap>(coreComponents)

export function useComponents() {
  return useContext(ComponentsContext)
}

export const ComponentsProvider = ComponentsContext.Provider

