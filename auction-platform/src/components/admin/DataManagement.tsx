import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  TextField,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  Assessment,
  DataUsage,
  CleaningServices,
  School,
  Storage,
  Backup,
} from '@mui/icons-material';
import { dataManagementApi, adminApi } from '../../api';
import type { DataStatistics } from '../../api/types';

const DataManagement: React.FC = () => {
  const [statistics, setStatistics] = useState<DataStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [makeActive, setMakeActive] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await dataManagementApi.getDataStatistics();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch data statistics:', err);
      setAlert({ type: 'error', message: 'Failed to load statistics. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/xml' || file.name.endsWith('.xml')) {
        setSelectedFile(file);
        setAlert(null);
      } else {
        setAlert({ type: 'error', message: 'Please select a valid XML file.' });
      }
    }
  };

  const handleUploadXML = async () => {
    if (!selectedFile) return;

    try {
      setUploadLoading(true);
      const result = await dataManagementApi.loadXMLFile(selectedFile, makeActive);

      setAlert({
        type: 'success',
        message: `Successfully loaded ${result.items_loaded} items, created ${result.users_created} users, and ${result.categories_created} categories.`
      });

      setSelectedFile(null);
      setMakeActive(false);

      // Refresh statistics
      await fetchStatistics();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to upload XML file.' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLoadSampleData = async () => {
    try {
      setUploadLoading(true);
      const result = await dataManagementApi.loadSampleData(makeActive);

      setAlert({
        type: 'success',
        message: `Successfully loaded ${result.items_loaded} sample items.`
      });

      // Refresh statistics
      await fetchStatistics();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to load sample data.' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleTrainRecommendations = async () => {
    try {
      setUploadLoading(true);
      const result = await dataManagementApi.trainRecommendationModel();

      setAlert({
        type: 'success',
        message: `Recommendation model trained successfully. Training data: ${result.training_stats.interactions} interactions from ${result.training_stats.users} users.`
      });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to train recommendation model.' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCleanupTestData = async () => {
    try {
      setUploadLoading(true);
      const result = await dataManagementApi.cleanupTestData(true);

      setAlert({
        type: 'success',
        message: `Cleanup completed. Deleted ${result.deleted.items} items and ${result.deleted.users} test users.`
      });

      setCleanupDialogOpen(false);

      // Refresh statistics
      await fetchStatistics();
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to cleanup test data.' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleExportData = async (format: 'xml' | 'json') => {
    try {
      setUploadLoading(true);
      let blob: Blob;

      if (format === 'xml') {
        blob = await adminApi.exportAuctionsXML();
      } else {
        blob = await adminApi.exportAuctionsJSON();
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auctions.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setAlert({ type: 'success', message: `Data exported as ${format.toUpperCase()} successfully!` });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || `Failed to export ${format.toUpperCase()} data.` });
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: '2rem' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Data Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: '1.5rem' }}>
          Import auction data, manage system data, and export platform information
        </Typography>

        {/* Alert Messages */}
        {alert && (
          <Alert
            severity={alert.type}
            sx={{ mb: '1.5rem' }}
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}
      </Box>

      <Grid container spacing={'1.5rem'}>
        {/* Data Import Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CloudUpload color="primary" />
                Data Import
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: '0.5rem' }}>
                    Upload XML File
                  </Typography>
                  <input
                    type="file"
                    accept=".xml"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="xml-file-upload"
                  />
                  <label htmlFor="xml-file-upload">
                    <Button variant="outlined" component="span" fullWidth>
                      Select XML File
                    </Button>
                  </label>
                  {selectedFile && (
                    <Typography variant="body2" sx={{ mt: '0.5rem' }}>
                      Selected: {selectedFile.name}
                    </Typography>
                  )}
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={makeActive}
                      onChange={(e) => setMakeActive(e.target.checked)}
                    />
                  }
                  label="Make auctions active after import"
                />

                <Button
                  variant="contained"
                  onClick={handleUploadXML}
                  disabled={!selectedFile || uploadLoading}
                  startIcon={uploadLoading ? <CircularProgress size={20} /> : <CloudUpload />}
                  fullWidth
                >
                  Upload XML Data
                </Button>

                <Divider sx={{ my: '1rem' }} />

                <Button
                  variant="outlined"
                  onClick={handleLoadSampleData}
                  disabled={uploadLoading}
                  startIcon={uploadLoading ? <CircularProgress size={20} /> : <DataUsage />}
                  fullWidth
                >
                  Load Sample Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Export Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download color="primary" />
                Data Export
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Typography variant="body2" color="text.secondary">
                  Export all auction data in your preferred format
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => handleExportData('xml')}
                  disabled={uploadLoading}
                  startIcon={uploadLoading ? <CircularProgress size={20} /> : <Download />}
                  fullWidth
                >
                  Export as XML
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => handleExportData('json')}
                  disabled={uploadLoading}
                  startIcon={uploadLoading ? <CircularProgress size={20} /> : <Download />}
                  fullWidth
                >
                  Export as JSON
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Operations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Assessment color="primary" />
                System Operations
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Button
                  variant="outlined"
                  onClick={handleTrainRecommendations}
                  disabled={uploadLoading || !statistics?.recommendation_readiness}
                  startIcon={uploadLoading ? <CircularProgress size={20} /> : <School />}
                  fullWidth
                >
                  Train Recommendation Model
                  {!statistics?.recommendation_readiness && (
                    <Chip label="Need more data" color="warning" size="small" sx={{ ml: '0.5rem' }} />
                  )}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCleanupDialogOpen(true)}
                  disabled={uploadLoading}
                  startIcon={<CleaningServices />}
                  fullWidth
                >
                  Cleanup Test Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Storage color="primary" />
                Data Statistics
              </Typography>

              {statistics && (
                <List dense>
                  <ListItem>
                    <ListItemIcon><DataUsage /></ListItemIcon>
                    <ListItemText
                      primary="Total Bids"
                      secondary={statistics.bidding_statistics.total_bids.toLocaleString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Assessment /></ListItemIcon>
                    <ListItemText
                      primary="Total Bid Value"
                      secondary={`$${statistics.bidding_statistics.total_bid_value.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Backup /></ListItemIcon>
                    <ListItemText
                      primary="Unique Bidders"
                      secondary={statistics.bidding_statistics.unique_bidders.toLocaleString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Top Categories"
                      secondary={statistics.top_categories.slice(0, 3).map(cat => cat.name).join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Recommendation Ready"
                      secondary={
                        <Chip
                          label={statistics.recommendation_readiness ? 'Ready' : 'Need more data'}
                          color={statistics.recommendation_readiness ? 'success' : 'warning'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cleanup Confirmation Dialog */}
      <Dialog
        open={cleanupDialogOpen}
        onClose={() => setCleanupDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Data Cleanup</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clean up all test data? This will permanently delete:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="• All test auction items" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• All bids placed on items" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Test user accounts (with @example.com emails)" />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: '1rem' }}>
            This action cannot be undone!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCleanupTestData}
            color="error"
            variant="contained"
            disabled={uploadLoading}
          >
            {uploadLoading ? <CircularProgress size={20} /> : 'Confirm Cleanup'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataManagement;