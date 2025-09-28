import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Notifications,
  Message,
  AccountCircle,
  Security,
  Person,
  Gavel,
  Settings,
  ExitToApp,
  AdminPanelSettings,
} from '@mui/icons-material';

interface NavigationProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
}

const Navigation: React.FC<NavigationProps> = ({
  isAuthenticated,
  onLoginClick,
  onLogout,
  userName = 'User',
  userRole,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleMyAuctions = () => {
    handleClose();
    navigate('/my-auctions');
  };

  const handleSettings = () => {
    handleClose();
    // TODO: Navigate to settings page
  };

  const handleAdminPanel = () => {
    handleClose();
    navigate('/admin');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
<AppBar
  position="sticky"
  sx={{
    width: "100%",             // make sure it spans the screen
    left: 0,
    right: 0,
    backgroundColor: 'white',
    color: 'text.primary',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid',
    borderColor: 'neutral.slate200',
  }}
>
  <Toolbar sx={{ width: "100%", py: '0.5rem' }}>
        {/* Logo */}
        <Typography
          variant="h3"
          component="div"
          onClick={handleLogoClick}
          sx={{
            flexGrow: 0,
            mr: '2rem',
            fontWeight: 700,
            color: 'primary.main',
            cursor: 'pointer',
            '&:hover': {
              color: 'primary.dark',
            },
          }}
        >
          AuctionHub
        </Typography>

        {/* SSL/TLS Indicator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mr: '1.5rem',
            px: '1rem',
            py: '0.25rem',
            backgroundColor: 'accent.success',
            borderRadius: 1,
            color: 'white',
          }}
        >
          <Security sx={{ fontSize: '1rem', mr: '0.25rem' }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            SECURE
          </Typography>
        </Box>

        {/* Search Bar - Clickable to navigate to browse */}
        <Box sx={{ flexGrow: 1, mx: '2rem' }}>
          <Box
            onClick={() => navigate('/browse')}
            sx={{
              maxWidth: '31.25rem',
              mx: 'auto',
              p: '0.75rem',
              border: '0.0625rem solid',
              borderColor: 'neutral.slate200',
              borderRadius: '0.5rem',
              backgroundColor: 'neutral.slate50',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'primary.light',
                borderColor: 'primary.main',
                color: 'white',
              },
            }}
          >
            <Typography variant="body2" color="inherit">
              Search auctions...
            </Typography>
          </Box>
        </Box>

        {/* Right Side Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAuthenticated ? (
            <>
              {/* Create Auction Button */}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/create')}
                sx={{ mr: '1rem' }}
              >
                Create Auction
              </Button>

              {/* Notifications */}
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              {/* Messages */}
              <IconButton color="inherit" onClick={() => navigate('/messages')}>
                <Badge badgeContent={1} color="error">
                  <Message />
                </Badge>
              </IconButton>

              {/* Profile Menu */}
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{ ml: '0.5rem' }}
              >
                <Avatar sx={{ width: '2rem', height: '2rem', backgroundColor: 'primary.main' }}>
                  {userName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfile} sx={{ gap: '0.5rem' }}>
                  <Person fontSize="small" />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleMyAuctions} sx={{ gap: '0.5rem' }}>
                  <Gavel fontSize="small" />
                  My Auctions
                </MenuItem>
                {/* <MenuItem onClick={handleSettings} sx={{ gap: '0.5rem' }}>
                  <Settings fontSize="small" />
                  Settings
                </MenuItem> */}
                {userRole === 'admin' && (
                  <MenuItem onClick={handleAdminPanel} sx={{ gap: '0.5rem' }}>
                    <AdminPanelSettings fontSize="small" />
                    Admin Panel
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout} sx={{ gap: '0.5rem' }}>
                  <ExitToApp fontSize="small" />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<AccountCircle />}
              onClick={onLoginClick}
            >
              Login / Register
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;