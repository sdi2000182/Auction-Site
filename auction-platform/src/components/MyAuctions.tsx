import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Pagination,
} from '@mui/material';
import { itemsApi, bidsApi } from '../api';
import type { Item, Bid as ApiBid, BidSummary } from '../api/types';
import { getErrorMessage } from '../utils/errorHandling';
import { getAuctionImage } from '../utils/imageUtils';
import { convertToStarRating, formatRating } from '../utils/ratingUtils';
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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';



const getImageUrl = (imagePath: string, categories?: Array<{name: string; id: number}>, auctionId?: number): string => {
  if (!imagePath) {
    return categories ? getAuctionImage([], categories, auctionId) : getAuctionImage([], [], auctionId);
  }
  if (imagePath.startsWith('http')) return imagePath; // Already absolute URL
  return `${API_BASE_URL}${imagePath}`;
};

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
  id: number;
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
  itemId: number;
  itemName: string;
  finalPrice: number;
  endDate: string;
  sellerUsername: string;
  imageUrl: string;
}

interface AuctionBids {
  [auctionId: string]: Bid[];
}

// Helper function to calculate time remaining
const calculateTimeRemaining = (endDate: string, status: string): string => {
  if (status === 'draft') return 'Not started';
  if (status === 'ended') return 'Ended';

  // Validate the date string
  if (!endDate) return 'Invalid date';

  const end = new Date(endDate);
  const now = new Date();

  // Check if date is valid
  // if (isNaN(end.getTime()) || isNaN(now.getTime())) {
  //   return 'Invalid date';
  // }

  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  // Validate calculations
  if (isNaN(days) || isNaN(hours) || isNaN(minutes)) {
    return 'Invalid time';
  }

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const MyAuctions: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedAuction, setSelectedAuction] = useState<MyAuction | null>(null);
  const [showBidsDialog, setShowBidsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [auctionToDelete, setAuctionToDelete] = useState<MyAuction | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [myAuctions, setMyAuctions] = useState<MyAuction[]>([]);
  const [myBids, setMyBids] = useState<UserBid[]>([]);
  const [wonAuctions, setWonAuctions] = useState<WonAuction[]>([]);
  const [auctionBids, setAuctionBids] = useState<{ [key: number]: BidSummary[] }>({});

  // Pagination state
  const [activePage, setActivePage] = useState(1);
  const [endedPage, setEndedPage] = useState(1);
  const [draftPage, setDraftPage] = useState(1);
  const itemsPerPage = 6;

  // Treat draft and active as one unified "active" status
  const activeAuctions = myAuctions.filter(a => a.status === 'active' || a.status === 'draft');
  const endedAuctions = myAuctions.filter(a => a.status === 'ended');
  // Keep drafts separate for tab display
  const draftAuctions = myAuctions.filter(a => a.status === 'draft');

  // Pagination helpers
  const getPaginatedData = (data: MyAuction[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (total: number) => Math.ceil(total / itemsPerPage);

  // Paginated data
  const paginatedActiveAuctions = getPaginatedData(activeAuctions, activePage);
  const paginatedEndedAuctions = getPaginatedData(endedAuctions, endedPage);
  const paginatedDraftAuctions = getPaginatedData(draftAuctions, draftPage);

  // Fetch user's auction data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [myItems, userBids, winningBids] = await Promise.all([
        itemsApi.getMyItems(),
        bidsApi.getMyBids(),
        bidsApi.getMyWinningBids()
      ]);

      console.log('Raw userBids data:', userBids);
      console.log('Raw winningBids data:', winningBids);

      // Transform API items to MyAuction format
      const transformedAuctions: MyAuction[] = myItems.map(item => ({
        id: item.id,
        itemName: item.name,
        description: item.description || '',
        category: item.categories.length > 0 ? item.categories[0].name : 'Uncategorized',
        images: item.images || ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'],
        currentPrice: item.currently,
        startingPrice: item.first_bid,
        buyNowPrice: item.buy_price,
        bidCount: item.number_of_bids,
        timeRemaining: calculateTimeRemaining(item.ends, item.status),
        status: item.status,
        endDate: new Date(item.ends),
        views: 0, // Not available in API
        watchers: 0, // Not available in API
        location: item.location || 'Unknown'
      }));

      // Create a set of winning bid IDs for quick lookup
      const winningBidIds = new Set(winningBids.map(bid => bid.id));

      // Get unique item IDs from all bids to fetch item data if missing
      const allItemIds = Array.from(new Set([...userBids.map(bid => bid.item_id), ...winningBids.map(bid => bid.item_id)]));

      // Check if we have item data, if not fetch it
      const itemsData: Record<number, any> = {};

      for (const bid of [...userBids, ...winningBids]) {
        if (bid.item && bid.item.name) {
          itemsData[bid.item_id] = bid.item;
        }
      }

      // Fetch missing item data
      const missingItemIds = allItemIds.filter(id => !itemsData[id]);
      if (missingItemIds.length > 0) {
        console.log('Fetching missing item data for IDs:', missingItemIds);
        const itemPromises = missingItemIds.map(id => itemsApi.getItem(id).catch(err => {
          console.error(`Failed to fetch item ${id}:`, err);
          return null;
        }));
        const fetchedItems = await Promise.all(itemPromises);

        fetchedItems.forEach((item, index) => {
          if (item) {
            itemsData[missingItemIds[index]] = item;
          }
        });
      }

      // Group bids by item and get the highest bid for each item
      const bidsByItem = userBids.reduce((acc, bid) => {
        const itemId = bid.item_id.toString();
        if (!acc[itemId] || acc[itemId].amount < bid.amount) {
          acc[itemId] = bid;
        }
        return acc;
      }, {} as Record<string, typeof userBids[0]>);

      // Transform API bids to UserBid format (only highest bid per item)
      const transformedMyBids: UserBid[] = Object.values(bidsByItem).map(bid => {
        // A bid is winning if it's in the winning bids list from the API
        const isWinning = winningBidIds.has(bid.id);
        const itemData = itemsData[bid.item_id];

        return {
          id: bid.id.toString(),
          auctionId: bid.item_id.toString(),
          auctionName: itemData?.name || bid.item?.name || `Item #${bid.item_id}`,
          amount: bid.amount,
          time: new Date(bid.time).toLocaleString(),
          isWinning: isWinning,
          isEnded: itemData?.status === 'ended' || bid.item?.status === 'ended',
          currentPrice: itemData?.currently || bid.item?.currently || bid.amount,
          imageUrl: getImageUrl(
            (itemData?.images || bid.item?.images || [])[0] || '',
            itemData?.categories || bid.item?.categories || [],
            itemData?.id || bid.item?.id
          )
        };
      });

      const transformedWonAuctions: WonAuction[] = winningBids.map(bid => {
        const itemData = itemsData[bid.item_id];
        return {
          id: bid.id.toString(),
          itemId: itemData?.id || bid.item?.id || bid.item_id,
          itemName: itemData?.name || bid.item?.name || `Item #${bid.item_id}`,
          finalPrice: bid.amount,
          endDate: new Date(bid.time).toLocaleDateString(),
          sellerUsername: itemData?.seller?.username || bid.item?.seller?.username || 'Unknown',
          imageUrl: getImageUrl(
            (itemData?.images || bid.item?.images || [])[0] || '',
            itemData?.categories || bid.item?.categories || [],
            itemData?.id || bid.item?.id || bid.item_id
          )
        };
      });

      setMyAuctions(transformedAuctions);
      setMyBids(transformedMyBids);
      setWonAuctions(transformedWonAuctions);
    } catch (error: any) {
      console.error('Failed to fetch auction data:', error);
      setAlert({ type: 'error', message: 'Failed to load auction data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewBids = async (auction: MyAuction) => {
    try {
      const bids = await bidsApi.getItemBids(auction.id);
      setAuctionBids(prev => ({ ...prev, [auction.id]: bids }));
      setSelectedAuction(auction);
      setShowBidsDialog(true);
    } catch (error: any) {
      setAlert({ type: 'error', message: 'Failed to load bids.' });
    }
  };

  const handleStartAuction = async (auctionId: number) => {
    try {
      await itemsApi.startAuction(auctionId);
      setAlert({ type: 'success', message: 'Auction started successfully!' });
      // Refresh the auctions list to update status
      await fetchData();
      setTimeout(() => setAlert(null), 3000);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  // These handlers are now defined below in the updated section

  const confirmDelete = async () => {
    if (auctionToDelete) {
      try {
        await itemsApi.deleteItem(auctionToDelete.id);
        setMyAuctions(prev => prev.filter(a => a.id !== auctionToDelete.id));
        setAlert({ type: 'success', message: `Auction "${auctionToDelete.itemName}" deleted successfully.` });
        setShowDeleteDialog(false);
        setAuctionToDelete(null);
        setTimeout(() => setAlert(null), 3000);
      } catch (error: any) {
        setAlert({ type: 'error', message: 'Failed to delete auction. Please try again.' });
      }
    }
  };

  // Helper functions to determine if auction can be edited or deleted
  const canEditAuction = (auction: MyAuction): boolean => {
    // Can only edit if there are no bids and auction hasn't started (status is 'draft')
    return auction.bidCount === 0 && auction.status === 'draft';
  };

  const canDeleteAuction = (auction: MyAuction): boolean => {
    // Can only delete if there are no bids and auction hasn't started (status is 'draft')
    return auction.bidCount === 0 && auction.status === 'draft';
  };

  // Updated handlers with validation
  const handleEditAuction = (auction: MyAuction) => {
    if (!canEditAuction(auction)) {
      setAlert({ 
        type: 'error', 
        message: 'Cannot edit auction that has bids or has already started.' 
      });
      setTimeout(() => setAlert(null), 5000);
      return;
    }
    console.log('Edit auction clicked:', auction.id);
    navigate(`/edit/${auction.id}`);
  };

  const handleDeleteAuction = (auction: MyAuction) => {
    if (!canDeleteAuction(auction)) {
      setAlert({ 
        type: 'error', 
        message: 'Cannot delete auction that has bids or has already started.' 
      });
      setTimeout(() => setAlert(null), 5000);
      return;
    }
    console.log('Delete auction clicked:', auction.id);
    setAuctionToDelete(auction);
    setShowDeleteDialog(true);
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
      case 'draft': return <Schedule />;
      default: return <Schedule />;
    }
  };

  const formatTimeRemaining = (endDate: string, status: string): string => {
    if (status === 'ended') return 'Ended';
    if (status === 'draft') return 'Not started';

    // Validate the date string
    if (!endDate) return 'Invalid date';

    const now = new Date();
    const end = new Date(endDate);

    // Check if date is valid
    if (isNaN(end.getTime()) || isNaN(now.getTime())) {
      return 'Invalid date';
    }

    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    // Validate calculations
    if (isNaN(days) || isNaN(hours) || isNaN(minutes)) {
      return 'Invalid time';
    }

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderAuctionGrid = (auctions: MyAuction[]) => (
    <Grid container spacing={'2rem'}>
      {auctions.map((auction) => (
        <Grid item xs={12} sm={6} md={4} key={auction.id}>
          <Card
            onClick={() => navigate(`/auction/${auction.id}`)}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '1rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
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
                image={getImageUrl(auction.images && auction.images.length > 0 ? auction.images[0] : '', [{ name: auction.category, id: 0 }], auction.id)}
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

              {/* Edit/Delete Status Badge */}
              {!canEditAuction(auction) && !canDeleteAuction(auction) && auction.bidCount > 0 && (
                <Chip
                  label="Has Bids"
                  color="warning"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: '#ff9800',
                    color: 'white',
                  }}
                />
              )}

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

              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: '0.5rem', mt: 'auto' }}>
                {auction.status === 'active' && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewBids(auction);
                      }}
                      sx={{ flex: 1 }}
                    >
                      View Bids
                    </Button>
                    <Tooltip 
                      title={
                        canEditAuction(auction) 
                          ? "Edit Auction" 
                          : "Cannot edit: Auction has bids or has started"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAuction(auction);
                          }}
                          color="primary"
                          disabled={!canEditAuction(auction)}
                          sx={{ 
                            opacity: canEditAuction(auction) ? 1 : 0.4,
                            '&:disabled': { 
                              color: 'text.disabled',
                              cursor: 'not-allowed'
                            }
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartAuction(auction.id);
                      }}
                    >
                      Start Auction
                    </Button>
                    <Tooltip 
                      title={
                        canEditAuction(auction) 
                          ? "Edit Auction" 
                          : "Cannot edit: Auction has bids or has started"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAuction(auction);
                          }}
                          disabled={!canEditAuction(auction)}
                          sx={{ 
                            opacity: canEditAuction(auction) ? 1 : 0.4,
                            '&:disabled': { 
                              color: 'text.disabled',
                              cursor: 'not-allowed'
                            }
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}

                {auction.status === 'ended' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewBids(auction);
                    }}
                    sx={{ flex: 1 }}
                  >
                    Final Results
                  </Button>
                )}

                {/* Delete button - only show if auction can be deleted */}
                {canDeleteAuction(auction) && (
                  <Tooltip title="Delete Auction">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAuction(auction);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Show disabled delete button with tooltip for non-deletable auctions */}
                {!canDeleteAuction(auction) && (auction.status === 'draft' || auction.status === 'ended') && (
                  <Tooltip title="Cannot delete: Auction has bids or has started">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={true}
                        sx={{ 
                          opacity: 0.4,
                          '&:disabled': { 
                            color: 'text.disabled',
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: '1rem' }}>
            Loading your auctions...
          </Typography>
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
                ${myAuctions.reduce((sum, a) => sum + a.currentPrice, 0).toLocaleString()}
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
                {myAuctions.reduce((sum, a) => sum + a.bidCount, 0)}
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
                {myAuctions.reduce((sum, a) => sum + a.views, 0)}
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
                <>
                  {renderAuctionGrid(paginatedActiveAuctions)}
                  {getTotalPages(activeAuctions.length) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: '2rem' }}>
                      <Pagination
                        count={getTotalPages(activeAuctions.length)}
                        page={activePage}
                        onChange={(event, value) => setActivePage(value)}
                        color="primary"
                        size="large"
                      />
                    </Box>
                  )}
                </>
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
                <>
                  {renderAuctionGrid(paginatedEndedAuctions)}
                  {getTotalPages(endedAuctions.length) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: '2rem' }}>
                      <Pagination
                        count={getTotalPages(endedAuctions.length)}
                        page={endedPage}
                        onChange={(event, value) => setEndedPage(value)}
                        color="primary"
                        size="large"
                      />
                    </Box>
                  )}
                </>
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
                <>
                  {renderAuctionGrid(paginatedDraftAuctions)}
                  {getTotalPages(draftAuctions.length) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: '2rem' }}>
                      <Pagination
                        count={getTotalPages(draftAuctions.length)}
                        page={draftPage}
                        onChange={(event, value) => setDraftPage(value)}
                        color="primary"
                        size="large"
                      />
                    </Box>
                  )}
                </>
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
              {myBids.length > 0 ? (
                <Grid container spacing={'2rem'}>
                  {myBids.map((bid) => (
                    <Grid item xs={12} sm={6} md={4} key={bid.id}>
                      <Card
                        onClick={() => navigate(`/auction/${bid.auctionId}`)}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '1rem',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
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
                              minHeight: '4em',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.25,
                            }}
                          >
                            {bid.auctionName?.trim() || `Auction #${bid.auctionId}`}
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
              {wonAuctions.length > 0 ? (
                <Grid container spacing={'2rem'}>
                  {wonAuctions.map((won) => (
                    <Grid item xs={12} sm={6} md={4} key={won.id}>
                      <Card
                        onClick={() => navigate(`/auction/${won.itemId}`)}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '1rem',
                          cursor: 'pointer',
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
                              minHeight: '4em',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.25,
                            }}
                          >
                            {won.itemName?.trim() || `Auction #${won.id}`}
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
            {selectedAuction && auctionBids[selectedAuction.id] && (
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
                      {auctionBids[selectedAuction.id].map((bid, index) => (
                        <TableRow
                          key={bid.id}
                          sx={{
                            backgroundColor: index === 0 ? 'success.light' : 'transparent',
                            '&:hover': { backgroundColor: index === 0 ? 'success.light' : 'action.hover' }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Avatar sx={{ width: '2rem', height: '2rem', backgroundColor: 'primary.main' }}>
                                {bid.bidder_username.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {bid.bidder_username}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Rating value={convertToStarRating(bid.bidder_rating)} readOnly size="small" />
                                  <Typography variant="caption">{formatRating(bid.bidder_rating)}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight={index === 0 ? 700 : 500}
                              color={index === 0 ? 'success.main' : 'text.primary'}
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
                            {index === 0 && (
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