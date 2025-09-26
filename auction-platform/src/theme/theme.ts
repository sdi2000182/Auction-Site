import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: {
      success: string;
      warning: string;
      error: string;
    };
    neutral: {
      slate50: string;
      slate200: string;
      slate500: string;
      slate700: string;
    };
  }

  interface PaletteOptions {
    accent?: {
      success?: string;
      warning?: string;
      error?: string;
    };
    neutral?: {
      slate50?: string;
      slate200?: string;
      slate500?: string;
      slate700?: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0F172A', // Deep Ocean Blue
      light: '#3B82F6', // Bright Azure
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#3B82F6', // Bright Azure
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF', // Pearl White
      paper: '#F8FAFC', // Slate-50
    },
    text: {
      primary: '#334155', // Slate-700
      secondary: '#64748B', // Slate-500
    },
    accent: {
      success: '#10B981', // Emerald Success
      warning: '#F59E0B', // Amber Warning
      error: '#EF4444', // Rose Error
    },
    neutral: {
      slate50: '#F8FAFC',
      slate200: '#E2E8F0',
      slate500: '#64748B',
      slate700: '#334155',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '48px',
      lineHeight: '56px',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '36px',
      lineHeight: '44px',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 500,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontSize: '18px',
      lineHeight: '28px',
      fontWeight: 500,
    },
    body1: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
    },
    body2: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
    },
    caption: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '12px 24px',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.02)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            boxShadow: '0 6px 12px rgba(59, 130, 246, 0.3)',
          },
        },
        outlined: {
          border: '2px solid #E2E8F0',
          '&:hover': {
            backgroundColor: '#F8FAFC',
            border: '2px solid #CBD5E1',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            height: '48px',
            borderRadius: '8px',
            '& fieldset': {
              border: '1px solid #E2E8F0',
            },
            '&:hover fieldset': {
              border: '1px solid #CBD5E1',
            },
            '&.Mui-focused fieldset': {
              border: '2px solid #3B82F6',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '16px',
          '&.Mui-selected': {
            color: '#3B82F6',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#3B82F6',
          height: '3px',
          borderRadius: '3px',
        },
      },
    },
  },
});