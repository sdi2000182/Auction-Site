import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Rating,
  IconButton,
  Tooltip,
  Divider,
  TextField,
} from '@mui/material';
import {
  Gavel,
  Edit,
  Delete,
  Visibility,
  MonetizationOn,
  Schedule,
  TrendingUp,
  LocalOffer,
  Person,
  AccessTime,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

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
      id={`auction-tabpanel-${index}`}
      aria-labelledby={`auction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: '1.5rem' }}>{children}</Box>}
    </div>
  );
}

interface MyAuction {
  id: string;
  itemName: string;
  description: string;
  category: string;
  images: string[];
  currentPrice: number;
  startingPrice: number;
  buyNowPrice?: number;
  bidCount: number;
  timeRemaining: string;
  status: 'active' | 'ended' | 'draft';
  endDate: Date;
  views: number;
  watchers: number;
  location: string;
}

interface Bid {
  id: string;
  bidderUsername: string;
  amount: number;
  time: string;
  rating: number;
  isWinning: boolean;
}

interface UserBid {
  id: string;
  auctionId: string;
  auctionName: string;
  amount: number;
  time: string;
  isWinning: boolean;
  isEnded: boolean;
  currentPrice: number;
  imageUrl: string;
}

interface WonAuction {
  id: string;
  itemName: string;
  finalPrice: number;
  endDate: string;
  sellerUsername: string;
  imageUrl: string;
}

interface AuctionBids {
  [auctionId: string]: Bid[];
}

// Mock data
const mockMyAuctions: MyAuction[] = [
  {
    id: '1',
    itemName: 'Vintage Camera Collection - Rare 1960s Leica',
    description: 'Exceptional vintage camera collection in excellent condition...',
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'],
    currentPrice: 1250,
    startingPrice: 500,
    buyNowPrice: 2500,
    bidCount: 15,
    timeRemaining: '2d 14h 30m',
    status: 'active',
    endDate: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000),
    views: 89,
    watchers: 12,
    location: 'New York, NY'
  },
  {
    id: '2',
    itemName: 'Gaming Console Bundle with Games',
    description: 'Complete gaming setup with controller and popular games...',
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1486401899868-0e435edeabfa?w=400'],
    currentPrice: 520,
    startingPrice: 300,
    bidCount: 22,
    timeRemaining: '5h 15m',
    status: 'active',
    endDate: new Date(Date.now() + 5.25 * 60 * 60 * 1000),
    views: 156,
    watchers: 28,
    location: 'New York, NY'
  },
  {
    id: '3',
    itemName: 'Professional Camera Lens',
    description: 'High-quality lens for professional photography...',
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400'],
    currentPrice: 850,
    startingPrice: 400,
    buyNowPrice: 1200,
    bidCount: 8,
    timeRemaining: 'Ended',
    status: 'ended',
    endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    views: 67,
    watchers: 15,
    location: 'New York, NY'
  },
  {
    id: '4',
    itemName: 'Vintage Vinyl Record Collection',
    description: 'Rare jazz and rock records from the 70s and 80s...',
    category: 'Music',
    images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'],
    currentPrice: 0,
    startingPrice: 200,
    bidCount: 0,
    timeRemaining: 'Draft',
    status: 'draft',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    views: 0,
    watchers: 0,
    location: 'New York, NY'
  }
];

const mockBids: AuctionBids = {
  '1': [
    { id: '1', bidderUsername: 'PhotoEnthusiast', amount: 1250, time: '2 minutes ago', rating: 4.9, isWinning: true },
    { id: '2', bidderUsername: 'CameraLover', amount: 1200, time: '15 minutes ago', rating: 4.7, isWinning: false },
    { id: '3', bidderUsername: 'VintageHunter', amount: 1150, time: '1 hour ago', rating: 4.5, isWinning: false },
  ],
  '2': [
    { id: '4', bidderUsername: 'GamerPro', amount: 520, time: '5 minutes ago', rating: 4.8, isWinning: true },
    { id: '5', bidderUsername: 'ConsoleCollector', amount: 500, time: '30 minutes ago', rating: 4.6, isWinning: false },
  ],
  '3': [
    { id: '6', bidderUsername: 'LensExpert', amount: 850, time: '1 day ago', rating: 4.9, isWinning: true },
  ]
};

// Mock data for user's bids
const mockUserBids: UserBid[] = [
  {
    id: '1',
    auctionId: '5',
    auctionName: 'Antique Watch Collection',
    amount: 850,
    time: '2 hours ago',
    isWinning: true,
    isEnded: false,
    currentPrice: 850,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
  },
  {
    id: '2',
    auctionId: '6',
    auctionName: 'Classic Guitar',
    amount: 1200,
    time: '1 day ago',
    isWinning: false,
    isEnded: false,
    currentPrice: 1350,
    imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400'
  },
  {
    id: '3',
    auctionId: '7',
    auctionName: 'Vintage Motorcycle',
    amount: 5000,
    time: '3 days ago',
    isWinning: false,
    isEnded: true,
    currentPrice: 5500,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
  }
];

// Mock data for won auctions
const mockWonAuctions: WonAuction[] = [
  {
    id: '1',
    itemName: 'Professional Camera Kit',
    finalPrice: 2250,
    endDate: '2 days ago',
    sellerUsername: 'PhotoPro',
    imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'
  },
  {
    id: '2',
    itemName: 'Limited Edition Sneakers',
    finalPrice: 450,
    endDate: '1 week ago',
    sellerUsername: 'SneakerHead',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
  }
];

const MyAuctions: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedAuction, setSelectedAuction] = useState<MyAuction | null>(null);
  const [showBidsDialog, setShowBidsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [auctionToDelete, setAuctionToDelete] = useState<MyAuction | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeAuctions = mockMyAuctions.filter(a => a.status === 'active');
  const endedAuctions = mockMyAuctions.filter(a => a.status === 'ended');
  const draftAuctions = mockMyAuctions.filter(a => a.status === 'draft');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewBids = (auction: MyAuction) => {
    setSelectedAuction(auction);
    setShowBidsDialog(true);
  };

  const handleDeleteAuction = (auction: MyAuction) => {
    setAuctionToDelete(auction);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (auctionToDelete) {
      setAlert({ type: 'success', message: `Auction "${auctionToDelete.itemName}" deleted successfully.` });
      setShowDeleteDialog(false);
      setAuctionToDelete(null);

      // Auto-hide alert
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleEditAuction = (auction: MyAuction) => {
    // Navigate to edit page with auction ID
    navigate(`/edit/${auction.id}`);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'ended': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'ended': return <Cancel />;
      case 'draft': return <Edit />;
      default: return <Schedule />;
    }
  };

  const formatTimeRemaining = (timeRemaining: string, status: string) => {
    if (status === 'ended') return 'Ended';
    if (status === 'draft') return 'Not started';
    return timeRemaining;
  };

  const renderAuctionGrid = (auctions: MyAuction[]) => (
    <Grid container spacing={'2rem'}>
      {auctions.map((auction) => (
        <Grid item xs={12} sm={6} md={4} key={auction.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '1rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="200"
                image={auction.images[0]}
                alt={auction.itemName}
                sx={{ objectFit: 'cover' }}
              />

              {/* Status Badge */}
              <Chip
                label={auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                color={getStatusColor(auction.status) as any}
                size="small"
                icon={getStatusIcon(auction.status)}
                sx={{
                  position: 'absolute',
                  top: '0.75rem',
                  left: '0.75rem',
                  fontWeight: 500,
                }}
              />

              {/* Stats Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  px: '0.5rem',
                  py: '0.25rem',
                  fontSize: '0.75rem'
                }}
              >
                {auction.views} views • {auction.watchers} watching
              </Box>
            </Box>

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: '1rem' }}>
              {/* Category */}
              <Chip
                label={auction.category}
                size="small"
                variant="outlined"
                sx={{ alignSelf: 'flex-start', mb: '0.5rem' }}
              />

              {/* Title */}
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{
                  mb: '0.5rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {auction.itemName}
              </Typography>

              {/* Price Info */}
              <Box sx={{ mb: '0.75rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '0.25rem' }}>
                  <MonetizationOn fontSize="small" color="success" />
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    ${auction.currentPrice.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({auction.bidCount} bids)
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Started at ${auction.startingPrice.toLocaleString()}
                  {auction.buyNowPrice && ` • Buy Now: $${auction.buyNowPrice.toLocaleString()}`}
                </Typography>
              </Box>

              {/* Time Remaining */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '1rem' }}>
                <AccessTime fontSize="small" color="warning" />
                <Typography variant="body2" color="warning.main" fontWeight={500}>
                  {formatTimeRemaining(auction.timeRemaining, auction.status)}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: '0.5rem', mt: 'auto' }}>
                {auction.status === 'active' && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewBids(auction)}
                      sx={{ flex: 1 }}
                    >
                      View Bids
                    </Button>
                    <Tooltip title="Edit Auction">
                      <IconButton
                        size="small"
                        onClick={() => handleEditAuction(auction)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </>
                )}

                {auction.status === 'draft' && (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Gavel />}
                      sx={{ flex: 1 }}
                    >
                      Start Auction
                    </Button>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditAuction(auction)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </>
                )}

                {auction.status === 'ended' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewBids(auction)}
                    sx={{ flex: 1 }}
                  >
                    Final Results
                  </Button>
                )}

                {(auction.status === 'draft' || auction.status === 'ended') && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAuction(auction)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: '2rem' }}>
        {/* Header */}
        <Box sx={{ mb: '2rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: '1rem' }}>
            <Gavel sx={{ fontSize: '2rem', color: 'primary.main' }} />
            <Typography variant="h2" component="h1">
              My Auctions
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage your auction listings, view bids, and track performance
          </Typography>
        </Box>

        {/* Alert */}
        {alert && (
          <Alert severity={alert.type} sx={{ mb: '1rem' }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={'2rem'} sx={{ mb: '2rem' }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '1rem', textAlign: 'center', p: '1rem' }}>
              <CheckCircle color="success" sx={{ fontSize: '2rem', mb: '0.5rem' }} />
              <Typography variant="h4" fontWeight={700} color="success.main">
                {activeAuctions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Auctions
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '1rem', textAlign: 'center', p: '1rem' }}>
              <TrendingUp color="primary" sx={{ fontSize: '2rem', mb: '0.5rem' }} />
              <Typography variant="h4" fontWeight={700} color="primary.main">
                ${mockMyAuctions.reduce((sum, a) => sum + a.currentPrice, 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '1rem', textAlign: 'center', p: '1rem' }}>
              <LocalOffer color="warning" sx={{ fontSize: '2rem', mb: '0.5rem' }} />
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {mockMyAuctions.reduce((sum, a) => sum + a.bidCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Bids
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '1rem', textAlign: 'center', p: '1rem' }}>
              <Visibility color="info" sx={{ fontSize: '2rem', mb: '0.5rem' }} />
              <Typography variant="h4" fontWeight={700} color="info.main">
                {mockMyAuctions.reduce((sum, a) => sum + a.views, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Views
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Main Tabs */}
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
                icon={<CheckCircle />}
                label={`Active (${activeAuctions.length})`}
                iconPosition="start"
              />
              <Tab
                icon={<Cancel />}
                label={`Ended (${endedAuctions.length})`}
                iconPosition="start"
              />
              <Tab
                icon={<Edit />}
                label={`Drafts (${draftAuctions.length})`}
                iconPosition="start"
              />
              <Tab
                icon={<LocalOffer />}
                label="My Bids"
                iconPosition="start"
              />
              <Tab
                icon={<CheckCircle />}
                label="Won Auctions"
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <Box sx={{ p: '1.5rem' }}>
            {/* Active Auctions Tab */}
            <TabPanel value={tabValue} index={0}>
              {activeAuctions.length > 0 ? (
                renderAuctionGrid(activeAuctions)
              ) : (
                <Box sx={{ textAlign: 'center', py: '3rem' }}>
                  <Gavel sx={{ fontSize: '4rem', color: 'text.secondary', mb: '1rem' }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No Active Auctions
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Start selling by creating your first auction
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Ended Auctions Tab */}
            <TabPanel value={tabValue} index={1}>
              {endedAuctions.length > 0 ? (
                renderAuctionGrid(endedAuctions)
              ) : (
                <Box sx={{ textAlign: 'center', py: '3rem' }}>
                  <Cancel sx={{ fontSize: '4rem', color: 'text.secondary', mb: '1rem' }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No Ended Auctions
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Completed auctions will appear here
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Draft Auctions Tab */}
            <TabPanel value={tabValue} index={2}>
              {draftAuctions.length > 0 ? (
                renderAuctionGrid(draftAuctions)
              ) : (
                <Box sx={{ textAlign: 'center', py: '3rem' }}>
                  <Edit sx={{ fontSize: '4rem', color: 'text.secondary', mb: '1rem' }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No Draft Auctions
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Draft auctions you're working on will appear here
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* My Bids Tab */}
            <TabPanel value={tabValue} index={3}>
              {mockUserBids.length > 0 ? (
                <Grid container spacing={'2rem'}>
                  {mockUserBids.map((bid) => (
                    <Grid item xs={12} sm={6} md={4} key={bid.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '1rem',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                          },
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="200"
                            image={bid.imageUrl}
                            alt={bid.auctionName}
                            sx={{ objectFit: 'cover' }}
                          />
                          <Chip
                            label={bid.isWinning ? 'Winning' : bid.isEnded ? 'Lost' : 'Outbid'}
                            color={bid.isWinning ? 'success' : bid.isEnded ? 'error' : 'warning'}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: '0.75rem',
                              left: '0.75rem',
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: '1rem' }}>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                              mb: '0.5rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {bid.auctionName}
                          </Typography>
                          <Box sx={{ mb: '0.75rem' }}>
                            <Typography variant="body2" color="text.secondary">
                              Your Bid
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="primary.main">
                              ${bid.amount.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: '0.75rem' }}>
                            <Typography variant="body2" color="text.secondary">
                              Current Price
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color={bid.isWinning ? 'success.main' : 'error.main'}>
                              ${bid.currentPrice.toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
                            Bid placed {bid.time}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: '3rem' }}>
                  <LocalOffer sx={{ fontSize: '4rem', color: 'text.secondary', mb: '1rem' }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No Bids Placed
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Auctions you've bid on will appear here
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Won Auctions Tab */}
            <TabPanel value={tabValue} index={4}>
              {mockWonAuctions.length > 0 ? (
                <Grid container spacing={'2rem'}>
                  {mockWonAuctions.map((won) => (
                    <Grid item xs={12} sm={6} md={4} key={won.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '1rem',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                          },
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="200"
                            image={won.imageUrl}
                            alt={won.itemName}
                            sx={{ objectFit: 'cover' }}
                          />
                          <Chip
                            label="Won"
                            color="success"
                            size="small"
                            icon={<CheckCircle />}
                            sx={{
                              position: 'absolute',
                              top: '0.75rem',
                              left: '0.75rem',
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: '1rem' }}>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                              mb: '0.5rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {won.itemName}
                          </Typography>
                          <Box sx={{ mb: '0.75rem' }}>
                            <Typography variant="body2" color="text.secondary">
                              Final Price
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="success.main">
                              ${won.finalPrice.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: '0.75rem' }}>
                            <Typography variant="body2" color="text.secondary">
                              Seller
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {won.sellerUsername}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
                            Won {won.endDate}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: '3rem' }}>
                  <CheckCircle sx={{ fontSize: '4rem', color: 'text.secondary', mb: '1rem' }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No Won Auctions
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Auctions you've won will appear here
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Box>
        </Paper>

        {/* View Bids Dialog */}
        <Dialog open={showBidsDialog} onClose={() => setShowBidsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Visibility color="primary" />
              Bids for "{selectedAuction?.itemName}"
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedAuction && mockBids[selectedAuction.id] && (
              <>
                <Box sx={{ mb: '1rem', p: '1rem', backgroundColor: 'neutral.slate50', borderRadius: '0.5rem' }}>
                  <Grid container spacing={'1rem'}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Current Price</Typography>
                      <Typography variant="h5" color="success.main" fontWeight={700}>
                        ${selectedAuction.currentPrice.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Bids</Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {selectedAuction.bidCount}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Bidder</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockBids[selectedAuction.id].map((bid) => (
                        <TableRow
                          key={bid.id}
                          sx={{
                            backgroundColor: bid.isWinning ? 'success.light' : 'transparent',
                            '&:hover': { backgroundColor: bid.isWinning ? 'success.light' : 'action.hover' }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Avatar sx={{ width: '2rem', height: '2rem', backgroundColor: 'primary.main' }}>
                                {bid.bidderUsername.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {bid.bidderUsername}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Rating value={bid.rating} readOnly size="small" />
                                  <Typography variant="caption">{bid.rating}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight={bid.isWinning ? 700 : 500}
                              color={bid.isWinning ? 'success.main' : 'text.primary'}
                            >
                              ${bid.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {bid.time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {bid.isWinning && (
                              <Chip
                                label="Winning Bid"
                                color="success"
                                size="small"
                                icon={<CheckCircle />}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBidsDialog(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>


        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: '1rem' }}>
              Are you sure you want to delete the auction "<strong>{auctionToDelete?.itemName}</strong>"?
            </Typography>
            <Alert severity="warning">
              This action cannot be undone. All auction data will be permanently removed.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete Auction
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default MyAuctions;