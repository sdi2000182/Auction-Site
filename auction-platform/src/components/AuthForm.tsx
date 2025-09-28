import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Security,
  Person,
  Email,
  Phone,
  LocationOn,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ mt: 2 }}>{children}</Box>}
    </div>
  );
}

interface AuthFormProps {
  onSuccess?: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps = {}) {
  const { login, register } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    location: '',
    country: '',
    tin: '',
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setShowSuccess(false);
  };

  const handleChange =
    (setter: Function, field: string) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setter((prev: any) => ({ ...prev, [field]: event.target.value }));
      setError('');
    };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!loginData.username || !loginData.password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(loginData.username, loginData.password);
      if (success) {
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowSuccess(false);

    // Enhanced validation
    if (!registerData.username || !registerData.password || !registerData.confirmPassword ||
        !registerData.firstName || !registerData.lastName || !registerData.email ||
        !registerData.phone || !registerData.address || !registerData.location ||
        !registerData.country || !registerData.tin) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const success = await register(registerData);
      if (success) {
        setShowSuccess(true);
        // Clear form data on successful registration
        setRegisterData({
          username: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          location: '',
          country: '',
          tin: '',
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable TextField with icon
  const renderField = (
    label: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    icon: React.ReactNode,
    type: string = 'text',
    showToggle?: boolean,
    toggleHandler?: () => void
  ) => (
    <TextField
      fullWidth
      variant="outlined"
      label={label}
      value={value}
      onChange={onChange}
      type={type}
      InputProps={{
        startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
        endAdornment: showToggle ? (
          <InputAdornment position="end">
            <IconButton onClick={toggleHandler} edge="end">
              {type === 'password' && showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 25%, #3B82F6 75%, #60A5FA 100%)',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0.1) 100%)',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(96, 165, 250, 0.2) 0%, transparent 50%)',
          animation: 'float 20s ease-in-out infinite',
          zIndex: 0,
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.1)' },
        },
      }}
    >
      <Card
        sx={{
          maxWidth: 900,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Security sx={{ fontSize: 50, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              AuctionHub
            </Typography>
            <Typography color="text.secondary">
              Secure access to your auction account
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {/* Login Tab */}
          <TabPanel value={tabValue} index={0}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {renderField('Username', loginData.username, handleChange(setLoginData, 'username'), <Person />)}
              <TextField
                fullWidth
                variant="outlined"
                label="Password"
                value={loginData.password}
                onChange={handleChange(setLoginData, 'password')}
                type={showPassword ? 'text' : 'password'}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ mt: 1.5 }}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </Box>
          </TabPanel>

          {/* Register Tab */}
          <TabPanel value={tabValue} index={1}>
            {showSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Registration successful! Your account is pending admin approval. You will be notified once approved.
              </Alert>
            )}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box
              component="form"
              onSubmit={handleRegister}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              {/* Left column */}
              {renderField('Username', registerData.username, handleChange(setRegisterData, 'username'), <Person />)}
              {renderField('Password', registerData.password, handleChange(setRegisterData, 'password'), <Lock />, showPassword ? 'text' : 'password', true, () => setShowPassword(!showPassword))}
              {renderField('Confirm Password', registerData.confirmPassword, handleChange(setRegisterData, 'confirmPassword'), <Lock />, showConfirmPassword ? 'text' : 'password', true, () => setShowConfirmPassword(!showConfirmPassword))}
              {renderField('First Name', registerData.firstName, handleChange(setRegisterData, 'firstName'), <Person />)}
              {renderField('Last Name', registerData.lastName, handleChange(setRegisterData, 'lastName'), <Person />)}

              {/* Right column */}
              {renderField('Email', registerData.email, handleChange(setRegisterData, 'email'), <Email />)}
              {renderField('Phone', registerData.phone, handleChange(setRegisterData, 'phone'), <Phone />)}
              {renderField('Tax ID', registerData.tin, handleChange(setRegisterData, 'tin'), <Business />)}
              {renderField('Address', registerData.address, handleChange(setRegisterData, 'address'), <LocationOn />)}
              {renderField('Location', registerData.location, handleChange(setRegisterData, 'location'), <LocationOn />)}
              {renderField('Country', registerData.country, handleChange(setRegisterData, 'country'), <LocationOn />)}

              {/* Submit button full width */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ mt: 1.5 }}
                >
                  {isLoading ? 'Creating Account...' : 'Register'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
