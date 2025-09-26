import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Notifications,
  Payment,
  Storage,
  Email,
  Delete,
  Add,
} from '@mui/icons-material';

const SystemSettings: React.FC = () => {
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [settings, setSettings] = useState({
    // Platform Settings
    platformName: 'AuctionHub',
    platformDescription: 'Modern E-Auction Platform',
    maintenanceMode: false,
    registrationEnabled: true,
    autoApproveUsers: false,

    // Auction Settings
    defaultAuctionDuration: 7,
    minBidIncrement: 5,
    maxAuctionDuration: 30,
    commissionRate: 5,
    allowBuyNow: true,

    // Security Settings
    requireEmailVerification: true,
    requirePhoneVerification: false,
    enableTwoFactor: false,
    passwordMinLength: 8,
    sessionTimeout: 60,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,

    // Payment Settings
    currency: 'USD',
    paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
    escrowEnabled: true,

    // System Health
    serverStatus: 'Online',
    databaseStatus: 'Connected',
    backupStatus: 'Last backup: 2 hours ago',
    storageUsed: '1.2 TB',
    storageLimit: '5 TB',
  });

  const [categories, setCategories] = useState([
    'Electronics',
    'Furniture',
    'Books',
    'Art & Collectibles',
    'Automotive',
    'Fashion',
    'Home & Garden',
    'Sports & Recreation',
  ]);

  const [newCategory, setNewCategory] = useState('');

  const handleSettingChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAlert({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to save settings. Please try again.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
  };

  const handleSystemAction = async (action: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (action) {
        case 'backup':
          setAlert({ type: 'success', message: 'System backup initiated successfully!' });
          break;
        case 'clear_cache':
          setAlert({ type: 'success', message: 'Cache cleared successfully!' });
          break;
        case 'restart_services':
          setAlert({ type: 'success', message: 'Services restarted successfully!' });
          break;
        default:
          break;
      }

      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: `Failed to ${action.replace('_', ' ')}. Please try again.` });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: '2rem' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: '1.5rem' }}>
          Configure platform settings, manage categories, and monitor system health
        </Typography>

        {/* Alert Messages */}
        {alert && (
          <Alert severity={alert.type} sx={{ mb: '1.5rem' }}>
            {alert.message}
          </Alert>
        )}
      </Box>

      <Grid container spacing={'1.5rem'}>
        {/* Platform Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Security color="primary" />
                Platform Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextField
                  label="Platform Name"
                  value={settings.platformName}
                  onChange={handleSettingChange('platformName')}
                  fullWidth
                />
                <TextField
                  label="Platform Description"
                  value={settings.platformDescription}
                  onChange={handleSettingChange('platformDescription')}
                  fullWidth
                  multiline
                  rows={2}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={handleSettingChange('maintenanceMode')}
                    />
                  }
                  label="Maintenance Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.registrationEnabled}
                      onChange={handleSettingChange('registrationEnabled')}
                    />
                  }
                  label="Enable User Registration"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoApproveUsers}
                      onChange={handleSettingChange('autoApproveUsers')}
                    />
                  }
                  label="Auto-approve New Users"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Auction Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Payment color="primary" />
                Auction Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextField
                  label="Default Auction Duration (days)"
                  type="number"
                  value={settings.defaultAuctionDuration}
                  onChange={handleSettingChange('defaultAuctionDuration')}
                  fullWidth
                />
                <TextField
                  label="Min Bid Increment ($)"
                  type="number"
                  value={settings.minBidIncrement}
                  onChange={handleSettingChange('minBidIncrement')}
                  fullWidth
                />
                <TextField
                  label="Commission Rate (%)"
                  type="number"
                  value={settings.commissionRate}
                  onChange={handleSettingChange('commissionRate')}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowBuyNow}
                      onChange={handleSettingChange('allowBuyNow')}
                    />
                  }
                  label="Allow Buy Now Option"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.escrowEnabled}
                      onChange={handleSettingChange('escrowEnabled')}
                    />
                  }
                  label="Enable Escrow Service"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Security color="primary" />
                Security Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextField
                  label="Password Min Length"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={handleSettingChange('passwordMinLength')}
                  fullWidth
                />
                <TextField
                  label="Session Timeout (minutes)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={handleSettingChange('sessionTimeout')}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireEmailVerification}
                      onChange={handleSettingChange('requireEmailVerification')}
                    />
                  }
                  label="Require Email Verification"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requirePhoneVerification}
                      onChange={handleSettingChange('requirePhoneVerification')}
                    />
                  }
                  label="Require Phone Verification"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableTwoFactor}
                      onChange={handleSettingChange('enableTwoFactor')}
                    />
                  }
                  label="Enable Two-Factor Authentication"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Notifications color="primary" />
                Notification Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingChange('emailNotifications')}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={handleSettingChange('smsNotifications')}
                    />
                  }
                  label="SMS Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={handleSettingChange('pushNotifications')}
                    />
                  }
                  label="Push Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketingEmails}
                      onChange={handleSettingChange('marketingEmails')}
                    />
                  }
                  label="Marketing Emails"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Category Management
              </Typography>
              <Box sx={{ mb: '1rem', display: 'flex', gap: '0.5rem' }}>
                <TextField
                  label="New Category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddCategory}
                  startIcon={<Add />}
                  disabled={!newCategory.trim()}
                >
                  Add
                </Button>
              </Box>
              <List dense>
                {categories.map((category) => (
                  <ListItem key={category}>
                    <ListItemText primary={category} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteCategory(category)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Storage color="primary" />
                System Health
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Server Status</Typography>
                  <Chip label={settings.serverStatus} color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Database Status</Typography>
                  <Chip label={settings.databaseStatus} color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Backup Status</Typography>
                  <Typography variant="body2" color="text.secondary">{settings.backupStatus}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Storage Usage</Typography>
                  <Typography variant="body2">{settings.storageUsed} / {settings.storageLimit}</Typography>
                </Box>

                <Divider sx={{ my: '1rem' }} />

                <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSystemAction('backup')}
                  >
                    Backup Now
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSystemAction('clear_cache')}
                  >
                    Clear Cache
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSystemAction('restart_services')}
                  >
                    Restart Services
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Settings */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Save />}
              onClick={handleSaveSettings}
              sx={{ minWidth: '10rem' }}
            >
              Save All Settings
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Reset to Defaults
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettings;