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
      paddingLeft={2} 
      paddingRight={2} 
      marginTop={0.5} 
      marginBottom={0.5}
    >
      {message.parts?.map((part) => {
        switch (part.type) {
          case 'text':
            return (
              <text wrap>{part.text}</text>
            )
          default:
            return null
        }
      })}
    </box>
  )
}