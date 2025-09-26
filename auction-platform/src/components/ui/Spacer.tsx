import { Box } from '@mui/material';

interface SpacerProps {
  size?: string | number;
  direction?: 'horizontal' | 'vertical';
  flex?: boolean;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = '1rem',
  direction = 'vertical',
  flex = false
}) => {
  if (flex) {
    return <Box sx={{ flex: 1 }} />;
  }

  return (
    <Box
      sx={{
        width: direction === 'horizontal' ? size : 0,
        height: direction === 'vertical' ? size : 0,
        flexShrink: 0,
      }}
    />
  );
};

export default Spacer;