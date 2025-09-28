import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { theme } from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import VisitorMode from './components/VisitorMode';
import AuthForm from './components/AuthForm';
import ProfileView from './components/ProfileView';
import AdminPanel from './components/admin/AdminPanel';
import AuctionBrowse from './components/AuctionBrowse';
import AuctionCreate from './components/AuctionCreate';
import AuctionDetail from './components/AuctionDetail';
import MyAuctions from './components/MyAuctions';
import Messages from './components/Messages';

function AppContent() {
  const { isAuthenticated, logout, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginClick = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    logout();
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Don't show navigation on auth page
  const showNavigation = location.pathname !== '/auth';

  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', margin: 0, padding: 0 }}>
        {showNavigation && (
          <Navigation
            isAuthenticated={isAuthenticated}
            onLoginClick={handleLoginClick}
            onLogout={handleLogout}
            userName={user?.firstName}
            userRole={user?.role}
          />
        )}

        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <HomePage />
                ) : (
                  <VisitorMode onLoginClick={handleLoginClick} />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? (
                  <ProfileView />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/auth"
              element={
                !isAuthenticated ? (
                  <AuthForm onSuccess={() => navigate('/')} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/browse"
              element={<AuctionBrowse />}
            />
            <Route
              path="/auction/:id"
              element={<AuctionDetail />}
            />
            <Route
              path="/my-auctions"
              element={
                isAuthenticated ? (
                  <MyAuctions />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/create"
              element={
                isAuthenticated ? (
                  <AuctionCreate />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/edit/:id"
              element={
                isAuthenticated ? (
                  <AuctionCreate />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/messages"
              element={
                isAuthenticated ? (
                  <Messages />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/admin"
              element={
                isAuthenticated && user?.role === 'admin' ? (
                  <AdminPanel />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;