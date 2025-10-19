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
    <box flexDirection="row" gap={1} flexWrap='wrap'>
      <text fg={getBoxColor(status)}>■</text>
      <text fg={colors.text.gray}><i>{name}</i></text>
    </box>
  );
}