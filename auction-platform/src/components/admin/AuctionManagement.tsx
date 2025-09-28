import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Alert,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Visibility,
  Delete,
  Flag,
  Search,
  Download,
  Assessment,
  AccessTime,
  MonetizationOn,
  Person,
} from '@mui/icons-material';
import { itemsApi, adminApi } from '../../api';
import type { ItemSummary } from '../../api/types';

// Use ItemSummary from API types, with additional fields for admin view
type AuctionItem = ItemSummary & {
  flagged?: boolean;
  flagReason?: string;
  description?: string; // Added for admin view dialog
};

const AuctionManagement: React.FC = () => {
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination state for backend integration
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);

      // Fetch all active items for admin view
      const items = await itemsApi.getActiveItems(0, 1000);

      // Transform API response to match component needs
      const transformedAuctions: AuctionItem[] = items.map(item => ({
        ...item,
        flagged: false, // This would come from admin-specific API if available
        flagReason: undefined,
      }));

      setAuctions(transformedAuctions);
    } catch (err) {
      console.error('Failed to fetch auctions:', err);
      setAlert({ type: 'error', message: 'Failed to load auctions. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []); // Only fetch on component mount

  const getFilteredAuctions = () => {
    return auctions.filter(auction => {
      const matchesStatus = filterStatus === 'all' || auction.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        auction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.location?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  };


  const handleViewAuction = (auction: AuctionItem) => {
    setSelectedAuction(auction);
    setViewDialogOpen(true);
  };


  const handleDeleteAuction = async (auctionId: number) => {
    if (window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      try {
        await itemsApi.deleteItem(auctionId);
        setAuctions(prev => prev.filter(auction => auction.id !== auctionId));
        setAlert({ type: 'success', message: 'Auction deleted successfully!' });
        setTimeout(() => setAlert(null), 3000);
      } catch (error: any) {
        console.error('Failed to delete auction:', error);
        setAlert({ type: 'error', message: error.message || 'Failed to delete auction.' });
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  const handleFlagAuction = async (auctionId: number, reason: string) => {
    try {
      // For now, just update local state since there's no flag API
      setAuctions(prev => prev.map(auction =>
        auction.id === auctionId ? { ...auction, flagged: true, flagReason: reason } : auction
      ));

      setAlert({ type: 'success', message: 'Auction flagged successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to flag auction.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'ended': return 'default';
      case 'draft': return 'primary'; // Using primary color which will be slate blue
      default: return 'default';
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Item Name', width: 200 },
    {
      field: 'seller',
      headerName: 'Seller',
      width: 130,
      valueGetter: (params) => params.row.seller?.username || 'Unknown',
    },
    {
      field: 'currently',
      headerName: 'Current Bid',
      width: 120,
      valueFormatter: (params) => `$${params.value}`,
    },
    {
      field: 'number_of_bids',
      headerName: 'Bids',
      width: 80,
      align: 'center',
    },
    {
      field: 'timeRemaining',
      headerName: 'Time Remaining',
      width: 130,
      valueGetter: (params) => formatTimeRemaining(params.row.ends),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
          sx={{ fontWeight: 500, textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'flagged',
      headerName: 'Flagged',
      width: 100,
      renderCell: (params) => (
        params.value ? (
          <Chip label="Flagged" color="error" size="small" icon={<Flag />} />
        ) : null
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Visibility sx={{ color: '#475569' }} />} // slate-600
          label="View"
          onClick={() => handleViewAuction(params.row)}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteAuction(params.row.id)}
          sx={{ color: 'error.main' }}
        />,
      ],
    },
  ];

  return (
    <Box>
      {/* Header and Controls */}
      <Box sx={{ mb: '2rem' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Auction Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: '1.5rem' }}>
          Monitor active auctions, review flagged items, and manage auction policies
        </Typography>

        {/* Alert Messages */}
        {alert && (
          <Alert severity={alert.type} sx={{ mb: '1.5rem' }}>
            {alert.message}
          </Alert>
        )}

        {/* Filters and Export */}
        <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search auctions..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              minWidth: '15rem',
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569', // slate-600
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#334155', // slate-700
                },
              },
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: '0.5rem', color: '#64748b' }} />, // slate-500
            }}
          />

          <TextField
            select
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            sx={{
              minWidth: '10rem',
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569', // slate-600
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#334155', // slate-700
                },
              },
              '& .MuiInputLabel-root': {
                '&.Mui-focused': {
                  color: '#334155', // slate-700
                },
              },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="ended">Ended</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
          </TextField>

          <Box sx={{ ml: 'auto', display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              sx={{
                borderColor: '#64748b', // slate-500
                color: '#475569', // slate-600
                '&:hover': {
                  borderColor: '#334155', // slate-700
                  backgroundColor: '#f1f5f9', // slate-50
                  color: '#334155',
                },
              }}
            >
              Analytics
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              sx={{
                borderColor: '#64748b', // slate-500
                color: '#475569', // slate-600
                '&:hover': {
                  borderColor: '#334155', // slate-700
                  backgroundColor: '#f1f5f9', // slate-50
                  color: '#334155',
                },
              }}
            >
              Export Data
            </Button>
          </Box>
        </Box>
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: '25rem', width: '100%' }}>
        <DataGrid
          rows={getFilteredAuctions()}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25, 50]}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e2e8f0', // slate-200
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f1f5f9', // slate-50
              borderBottom: '2px solid #cbd5e1', // slate-300
              color: '#334155', // slate-700
              fontWeight: 600,
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: '#f8fafc', // slate-50
              },
            },
            '& .MuiCheckbox-root': {
              color: '#64748b', // slate-500
              '&.Mui-checked': {
                color: '#475569', // slate-600
              },
            },
          }}
        />
      </Box>

      {/* Auction Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}> {/* slate-50, slate-200 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Box>
              <Typography variant="h5">
                {selectedAuction?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Auction ID: {selectedAuction?.id}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: '1rem' }}>
              {selectedAuction?.flagged && (
                <Chip
                  label="Flagged"
                  color="error"
                  icon={<Flag />}
                  sx={{ fontWeight: 500 }}
                />
              )}
              <Chip
                label={selectedAuction?.status}
                color={getStatusColor(selectedAuction?.status || '')}
                sx={{
                  fontWeight: 500,
                  textTransform: 'capitalize',
                  ...(selectedAuction?.status === 'draft' && {
                    backgroundColor: '#475569', // slate-600
                    color: 'white',
                  }),
                }}
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={'1.5rem'} sx={{ mt: '0.5rem' }}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#334155', fontWeight: 600 }} // slate-700
              >
                Auction Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Person sx={{ color: '#64748b' }} /> {/* slate-500 */}
                  <Box>
                    <Typography variant="body2" color="text.secondary">Seller</Typography>
                    <Typography variant="body1">{selectedAuction?.seller?.username || 'Unknown'}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MonetizationOn sx={{ color: '#64748b' }} /> {/* slate-500 */}
                  <Box>
                    <Typography variant="body2" color="text.secondary">Current Bid</Typography>
                    <Typography variant="body1">${selectedAuction?.currently}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AccessTime sx={{ color: '#64748b' }} /> {/* slate-500 */}
                  <Box>
                    <Typography variant="body2" color="text.secondary">Time Remaining</Typography>
                    <Typography variant="body1">
                      {selectedAuction ? formatTimeRemaining(selectedAuction.ends) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#334155', fontWeight: 600 }} // slate-700
              >
                Additional Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Location</Typography>
                  <Typography variant="body1">{selectedAuction?.location || 'Not specified'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Bid Count</Typography>
                  <Typography variant="body1">{selectedAuction?.number_of_bids} bids</Typography>
                </Box>
                {selectedAuction?.flagged && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Flag Reason</Typography>
                    <Typography variant="body1" color="error.main">
                      {selectedAuction?.flagReason}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: '#334155', fontWeight: 600 }} // slate-700
              >
                Description
              </Typography>
              <Typography variant="body1">{selectedAuction?.description || 'No description available'}</Typography>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{
          p: '1.5rem',
          backgroundColor: '#f8fafc', // slate-50
          borderTop: '1px solid #e2e8f0', // slate-200
        }}>
          {!selectedAuction?.flagged && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Flag />}
              onClick={() => {
                const reason = prompt('Enter flag reason:');
                if (reason && selectedAuction) {
                  handleFlagAuction(selectedAuction.id, reason);
                  setViewDialogOpen(false);
                }
              }}
            >
              Flag Auction
            </Button>
          )}
          <Button
            onClick={() => setViewDialogOpen(false)}
            sx={{
              color: '#475569', // slate-600
              '&:hover': {
                backgroundColor: '#f1f5f9', // slate-50
                color: '#334155', // slate-700
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuctionManagement;