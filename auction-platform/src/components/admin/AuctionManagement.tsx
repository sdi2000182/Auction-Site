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
  Pause,
  PlayArrow,
  Flag,
  Search,
  Download,
  Assessment,
  AccessTime,
  MonetizationOn,
  Person,
} from '@mui/icons-material';

interface Auction {
  id: string;
  itemName: string;
  seller: string;
  sellerId: string;
  currentBid: number;
  startPrice: number;
  buyNowPrice?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'ended' | 'suspended' | 'draft';
  bidCount: number;
  category: string;
  description: string;
  images: string[];
  flagged: boolean;
  flagReason?: string;
}

const AuctionManagement: React.FC = () => {
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
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
  const [totalRows, setTotalRows] = useState(0);

  // Mock auction data
  const [auctions, setAuctions] = useState<Auction[]>([
    {
      id: '1',
      itemName: 'Vintage Camera Collection',
      seller: 'John Doe',
      sellerId: '1',
      currentBid: 450,
      startPrice: 100,
      buyNowPrice: 800,
      startDate: '2024-03-15T10:00:00Z',
      endDate: '2024-03-22T18:00:00Z',
      status: 'active',
      bidCount: 12,
      category: 'Electronics',
      description: 'Rare collection of vintage cameras from the 1950s-1980s',
      images: ['camera1.jpg', 'camera2.jpg'],
      flagged: false,
    },
    {
      id: '2',
      itemName: 'Handcrafted Wooden Table',
      seller: 'Jane Smith',
      sellerId: '2',
      currentBid: 280,
      startPrice: 150,
      startDate: '2024-03-10T09:00:00Z',
      endDate: '2024-03-20T20:00:00Z',
      status: 'active',
      bidCount: 7,
      category: 'Furniture',
      description: 'Beautiful handcrafted oak dining table',
      images: ['table1.jpg'],
      flagged: true,
      flagReason: 'Suspected counterfeit materials',
    },
    {
      id: '3',
      itemName: 'Rare Book Collection',
      seller: 'Mike Johnson',
      sellerId: '3',
      currentBid: 650,
      startPrice: 200,
      startDate: '2024-03-01T12:00:00Z',
      endDate: '2024-03-15T15:00:00Z',
      status: 'ended',
      bidCount: 23,
      category: 'Books',
      description: 'First edition books from famous authors',
      images: ['books1.jpg', 'books2.jpg', 'books3.jpg'],
      flagged: false,
    },
    {
      id: '4',
      itemName: 'Gaming Console Bundle',
      seller: 'Alice Wilson',
      sellerId: '4',
      currentBid: 0,
      startPrice: 300,
      buyNowPrice: 500,
      startDate: '2024-03-25T14:00:00Z',
      endDate: '2024-04-01T14:00:00Z',
      status: 'draft',
      bidCount: 0,
      category: 'Electronics',
      description: 'Latest gaming console with accessories',
      images: ['console1.jpg'],
      flagged: false,
    },
  ]);

  const getFilteredAuctions = () => {
    return auctions.filter(auction => {
      const matchesStatus = filterStatus === 'all' || auction.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        auction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  };

  // Update total rows when auctions or filters change
  useEffect(() => {
    const filtered = getFilteredAuctions();
    setTotalRows(filtered.length);
  }, [auctions, filterStatus, searchTerm]);

  const handleViewAuction = (auction: Auction) => {
    setSelectedAuction(auction);
    setViewDialogOpen(true);
  };

  const handleSuspendAuction = async (auctionId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAuctions(prev => prev.map(auction =>
        auction.id === auctionId ? { ...auction, status: 'suspended' as const } : auction
      ));

      setAlert({ type: 'success', message: 'Auction suspended successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to suspend auction.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleResumeAuction = async (auctionId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAuctions(prev => prev.map(auction =>
        auction.id === auctionId ? { ...auction, status: 'active' as const } : auction
      ));

      setAlert({ type: 'success', message: 'Auction resumed successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to resume auction.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        setAuctions(prev => prev.filter(auction => auction.id !== auctionId));

        setAlert({ type: 'success', message: 'Auction deleted successfully!' });
        setTimeout(() => setAlert(null), 3000);
      } catch (error) {
        setAlert({ type: 'error', message: 'Failed to delete auction.' });
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  const handleFlagAuction = async (auctionId: string, reason: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      case 'suspended': return 'error';
      case 'draft': return 'info';
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
    { field: 'itemName', headerName: 'Item Name', width: 200 },
    { field: 'seller', headerName: 'Seller', width: 130 },
    {
      field: 'currentBid',
      headerName: 'Current Bid',
      width: 120,
      valueFormatter: (params) => `$${params.value}`,
    },
    {
      field: 'bidCount',
      headerName: 'Bids',
      width: 80,
      align: 'center',
    },
    {
      field: 'timeRemaining',
      headerName: 'Time Remaining',
      width: 130,
      valueGetter: (params) => formatTimeRemaining(params.row.endDate),
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
      width: 200,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="View Details">
              <Visibility />
            </Tooltip>
          }
          label="View"
          onClick={() => handleViewAuction(params.row)}
        />,
        ...(params.row.status === 'active' ? [
          <GridActionsCellItem
            icon={
              <Tooltip title="Suspend Auction">
                <Pause />
              </Tooltip>
            }
            label="Suspend"
            onClick={() => handleSuspendAuction(params.row.id)}
            sx={{ color: 'warning.main' }}
          />,
        ] : []),
        ...(params.row.status === 'suspended' ? [
          <GridActionsCellItem
            icon={
              <Tooltip title="Resume Auction">
                <PlayArrow />
              </Tooltip>
            }
            label="Resume"
            onClick={() => handleResumeAuction(params.row.id)}
            sx={{ color: 'success.main' }}
          />,
        ] : []),
        <GridActionsCellItem
          icon={
            <Tooltip title="Delete Auction">
              <Delete />
            </Tooltip>
          }
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
            sx={{ minWidth: '15rem' }}
            InputProps={{
              startAdornment: <Search sx={{ mr: '0.5rem', color: 'text.secondary' }} />,
            }}
          />

          <TextField
            select
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            sx={{ minWidth: '10rem' }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="ended">Ended</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
          </TextField>

          <Box sx={{ ml: 'auto', display: 'flex', gap: '0.5rem' }}>
            <Button variant="outlined" startIcon={<Assessment />}>
              Analytics
            </Button>
            <Button variant="outlined" startIcon={<Download />}>
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
          rowCount={totalRows}
          paginationMode="server"
          checkboxSelection
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'neutral.slate50',
              borderBottom: '2px solid #e0e0e0',
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
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Box>
              <Typography variant="h5">
                {selectedAuction?.itemName}
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
                sx={{ fontWeight: 500, textTransform: 'capitalize' }}
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={'1.5rem'} sx={{ mt: '0.5rem' }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Auction Details</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Person color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Seller</Typography>
                    <Typography variant="body1">{selectedAuction?.seller}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MonetizationOn color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Current Bid</Typography>
                    <Typography variant="body1">${selectedAuction?.currentBid}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AccessTime color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Time Remaining</Typography>
                    <Typography variant="body1">
                      {selectedAuction ? formatTimeRemaining(selectedAuction.endDate) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Additional Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Category</Typography>
                  <Typography variant="body1">{selectedAuction?.category}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Bid Count</Typography>
                  <Typography variant="body1">{selectedAuction?.bidCount} bids</Typography>
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
              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography variant="body1">{selectedAuction?.description}</Typography>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: '1.5rem' }}>
          {selectedAuction?.status === 'active' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<Pause />}
              onClick={() => {
                handleSuspendAuction(selectedAuction.id);
                setViewDialogOpen(false);
              }}
            >
              Suspend Auction
            </Button>
          )}
          {selectedAuction?.status === 'suspended' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrow />}
              onClick={() => {
                handleResumeAuction(selectedAuction.id);
                setViewDialogOpen(false);
              }}
            >
              Resume Auction
            </Button>
          )}
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
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuctionManagement;