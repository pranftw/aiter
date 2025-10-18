import { type UIMessage } from "ai"
import { Text, Box } from "ink"
import { colors } from '../../../utils/colors'

interface UserMessageProps {
  message: UIMessage
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <Box
      borderStyle="round"
      borderColor={colors.border.secondary}
      paddingX={2}
      marginY={0.5}
    >
      {message.parts?.map((part, index) => {
        switch (part.type) {
          case 'text':
            return (
              <Text key={index} wrap="wrap">
                {part.text}
              </Text>
            )
          default:
            return null
        }
      })}
    </Box>
  )
}