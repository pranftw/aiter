import { Text, Box } from 'ink';
import { colors } from '../utils/colors';


interface StatusIndicatorProps {
  id: string;
  name: string;
  status: string;
}


const getBoxColor = (status: string) => {
  const startedStatuses = ['start', 'input-available', 'input-streaming']
  const endedStatuses = ['finish', 'output-available']

  if (startedStatuses.includes(status)) {
    return colors.status.started;
  } else if (endedStatuses.includes(status)) {
    return colors.status.success;
  } else {
    return colors.status.error;
  }
}

export function StatusIndicator({ id, name, status }: StatusIndicatorProps) {
  return (
    <Box key={`status-indicator-${id}`} flexDirection="row" gap={1} flexWrap='wrap'>
      <Text color={getBoxColor(status)}>■</Text>
      <Text italic>{name}</Text>
    </Box>
  );
}