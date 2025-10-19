import { type UIMessage } from "ai"
import { colors } from '../../../utils/colors'

interface UserMessageProps {
  message: UIMessage
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <box
      border
      borderColor={colors.border.secondary} 
      paddingLeft={1} 
      paddingRight={1}
    >
      {message.parts?.map((part) => {
        switch (part.type) {
          case 'text':
            return (
              <text fg={colors.text.gray} wrap>{part.text}</text>
            )
          default:
            return null
        }
      })}
    </box>
  )
}