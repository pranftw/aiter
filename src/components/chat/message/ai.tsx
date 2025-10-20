import { type UIMessage, type ToolUIPart, type DynamicToolUIPart } from 'ai'
import { StatusIndicator } from '@/components/status-indicator'
import React from 'react'
import { SubagentToolCallStatusSchema } from '@/lib/schema'
import { z } from 'zod'
import { colors } from '@/utils/colors'



interface ToolCallDisplayProps {
  name: string
  status: 'in-progress' | 'output-available' | 'error' | 'input-streaming' | 'input-available' | 'output-error'
  input: unknown
  marginLeft?: number
  children?: React.ReactNode
}

function ToolCallDisplay({ name, status, input, marginLeft, children }: ToolCallDisplayProps) {
  return (
    <>
      <box flexDirection='row' gap={1} marginLeft={marginLeft} flexWrap='wrap'>
        <StatusIndicator name={name} status={status} />
        <text fg={colors.text.gray}><i>{JSON.stringify(input)}</i></text>
      </box>
      {status === 'output-available' && children}
    </>
  )
}



interface AIMessageProps {
  message: UIMessage
}

export function AIMessage({ message }: AIMessageProps) {
  return (
    <box flexDirection='column' gap={1}>
      {message.parts?.map((part, index) => {
        switch (part.type) {
          case 'reasoning':
            return <text key={index} wrap><i>{part.text}</i></text>
          case 'text':
            return <text key={index} wrap>{part.text}</text>
          default:
            if (part.type.startsWith('tool')) {
              const toolPart = part as ToolUIPart
              return (
                <box key={index}>
                  <ToolCallDisplay
                    name={part.type}
                    status={toolPart.state}
                    input={toolPart.input}
                  >
                    {(() => {
                      switch (toolPart.type) {
                        default:
                          return null
                      }
                    })()}
                  </ToolCallDisplay>
                </box>
              )
            }
            else if (part.type.startsWith('dynamic-tool')) {
              const dynamicToolPart = part as DynamicToolUIPart
              return (
                <box key={index}>
                  <ToolCallDisplay
                    name={`tool-${dynamicToolPart.toolName}`}
                    status={dynamicToolPart.state}
                    input={dynamicToolPart.input}
                  >
                    {(() => {
                      switch (dynamicToolPart.type) {
                        default:
                          return null
                      }
                    })()}
                  </ToolCallDisplay>
                </box>
              )
            }
            else if (part.type === 'data-subagent-tool-call') {
              const subagentToolCallPart = part.data as z.infer<typeof SubagentToolCallStatusSchema>
              return (
                <box key={index}>
                  <ToolCallDisplay
                    name={subagentToolCallPart.toolName}
                    status='output-available'
                    input={subagentToolCallPart.toolInput}
                    marginLeft={2}
                  />
                </box>
              )
            }
            return null
        }
      })}
    </box>
  )
}
