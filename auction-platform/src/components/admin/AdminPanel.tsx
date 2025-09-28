import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  Gavel,
  Assessment,
  Security,
  Dashboard,
  Storage,
} from '@mui/icons-material';
import UserManagement from './UserManagement';
import AuctionManagement from './AuctionManagement';
import SystemSettings from './SystemSettings';
import DataManagement from './DataManagement';
import { adminApi } from '../../api';
import type { AdminStatistics } from '../../api/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: '1.5rem' }}>{children}</Box>}
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDetailedStatistics();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch admin statistics:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: '2rem' }}>
          <Alert severity="error" sx={{ mb: '2rem' }}>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: '2rem' }}>
        {/* Header */}
        <Box sx={{ mb: '2rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: '1rem' }}>
            <Security sx={{ fontSize: '2rem', color: 'primary.main' }} />
            <Typography variant="h2" component="h1">
              Admin Panel
            </Typography>
            <Chip
              label="Administrator"
              color="primary"
              icon={<Security />}
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage users, oversee auctions, and configure system settings
          </Typography>
        </Box>

        {/* Quick Stats Dashboard */}
        <Grid container spacing={'1.5rem'} sx={{ mb: '2rem' }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: '1.5rem' }}>
                <People sx={{ fontSize: '2.5rem', color: 'primary.main', mb: '0.5rem' }} />
                <Typography variant="h4" component="div" gutterBottom>
                  {statistics?.users.total.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
                {statistics && statistics.users.inactive > 0 && (
                  <Chip
                    label={`${statistics.users.inactive} inactive`}
                    color="warning"
                    size="small"
                    sx={{ mt: '0.5rem' }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: '1.5rem' }}>
                <Gavel sx={{ fontSize: '2.5rem', color: 'success.main', mb: '0.5rem' }} />
                <Typography variant="h4" component="div" gutterBottom>
                  {statistics?.auctions.active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Auctions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: '1.5rem' }}>
                <Assessment sx={{ fontSize: '2.5rem', color: 'warning.main', mb: '0.5rem' }} />
                <Typography variant="h4" component="div" gutterBottom>
                  {statistics?.auctions.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Auctions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: '1.5rem' }}>
                <Dashboard sx={{ fontSize: '2.5rem', color: 'success.main', mb: '0.5rem' }} />
                <Typography variant="h4" component="div" gutterBottom>
                  ${statistics?.bids.total_value.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Bid Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Admin Tabs */}
        <Paper sx={{ borderRadius: '1rem', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: '1rem',
                  fontSize: '1rem',
                  fontWeight: 500,
                },
              }}
            >
              <Tab
                icon={<People />}
                label="User Management"
                id="admin-tab-0"
                aria-controls="admin-tabpanel-0"
                iconPosition="start"
              />
              <Tab
                icon={<Gavel />}
                label="Auction Management"
                id="admin-tab-1"
                aria-controls="admin-tabpanel-1"
                iconPosition="start"
              />
              {/* <Tab
                icon={<Storage />}
                label="Data Management"
                id="admin-tab-2"
                aria-controls="admin-tabpanel-2"
                iconPosition="start"
              />
              <Tab
                icon={<Security />}
                label="System Settings"
                id="admin-tab-3"
                aria-controls="admin-tabpanel-3"
                iconPosition="start"
              /> */}
            </Tabs>
          </Box>

          <Box sx={{ p: '1.5rem' }}>
            {/* User Management Tab */}
            <TabPanel value={tabValue} index={0}>
              <UserManagement />
            </TabPanel>

            {/* Auction Management Tab */}
            <TabPanel value={tabValue} index={1}>
              <AuctionManagement />
            </TabPanel>

            {/* Data Management Tab */}
            <TabPanel value={tabValue} index={2}>
              <DataManagement />
            </TabPanel>

            {/* System Settings Tab */}
            <TabPanel value={tabValue} index={3}>
              <SystemSettings />
            </TabPanel>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminPanel;