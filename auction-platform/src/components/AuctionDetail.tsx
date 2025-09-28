import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { itemsApi, bidsApi, messagesApi } from '../api';
import type { Item, Bid } from '../api/types';
import { useAuth } from '../context/AuthContext';
import SimilarItems from './SimilarItems';
import { getAuctionImage, getDefaultImages, getAuctionImages } from '../utils/imageUtils';
import { convertToStarRating, formatRating } from '../utils/ratingUtils';
import { Textarea } from './ui/Textarea';

import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
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
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';

import {
  Gavel,
  Timer,
  LocationOn,
  MonetizationOn,
  ShoppingCart,
  ArrowBack,
  ArrowForward,
  LocalOffer,
  Message,
} from '@mui/icons-material';

// Fix default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface BidHistory {
  id: number;
  bidderUsername: string;
  amount: number;
  time: string;
  rating?: number;
}

interface AuctionDetailData {
  id: number;
  name: string;
  description: string;
  categories: string[];
  currentPrice: number;
  buyNowPrice?: number;
  timeRemaining: string;
  endTime: Date;
  images: string[];
  location: string;
  latitude?: number;
  longitude?: number;
  sellerUsername: string;
  sellerId: number;
  sellerRating?: number;
  sellerLocation: string;
  bidHistory: BidHistory[];
  totalBids: number;
  isActive: boolean;
}

const AuctionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [biddingLoading, setBiddingLoading] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageData, setMessageData] = useState({ subject: '', content: '' });
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const loadAuctionData = async () => {
      if (!id) {
        setError('No auction ID provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const itemId = parseInt(id, 10);

        const [itemData, bidsData] = await Promise.all([
          itemsApi.getItem(itemId),
          bidsApi.getItemBids(itemId),
        ]);

        const transformedAuction: AuctionDetailData = {
          id: itemData.id,
          name: itemData.name,
          description: itemData.description || '',
          categories: itemData.categories.map((cat) => cat.name),
          currentPrice: itemData.currently || itemData.first_bid,
          buyNowPrice: itemData.buy_price || undefined,
          timeRemaining: '',
          endTime: new Date(itemData.ends),
          images: getAuctionImages(itemData.images || [], itemData.categories, itemData.id),
          location: itemData.location || '',
          latitude: itemData.latitude || undefined,
          longitude: itemData.longitude || undefined,
          sellerUsername: itemData.seller?.username || 'Unknown',
          sellerId: itemData.seller?.id || 0,
          sellerRating: itemData.seller?.seller_rating || undefined,
          sellerLocation: itemData.seller?.location || '',
          bidHistory: bidsData.map((bid) => ({
            id: bid.id,
            bidderUsername: bid.bidder_username || 'Anonymous',
            amount: bid.amount,
            time: new Date(bid.time).toLocaleString(),
            rating: bid.bidder_rating || undefined,
          })),
          totalBids: bidsData.length,
          isActive: itemData.status === 'active' && new Date(itemData.ends) > new Date(),
        };

        setAuction(transformedAuction);
      } catch (err: any) {
        console.error('Failed to load auction data:', err);
        setError(err.message || 'Failed to load auction details');
      } finally {
        setLoading(false);
      }
    };

    loadAuctionData();
  }, [id]);

  const handlePreviousImage = () => {
    if (!auction) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? auction.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!auction) return;
    setCurrentImageIndex((prev) =>
      prev === auction.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleBidSubmit = async () => {
    if (!auction || !user) {
      setAlert({ type: 'error', message: 'You must be logged in to place a bid' });
      return;
    }

    const amount = parseFloat(bidAmount);
    if (amount <= auction.currentPrice) {
      setAlert({ type: 'error', message: `Bid must be higher than current price of $${auction.currentPrice}` });
      return;
    }

    // Check if bid amount exceeds buy now price
    if (auction.buyNowPrice && amount >= auction.buyNowPrice) {
      setAlert({
        type: 'error',
        message: `Your bid of $${amount} meets or exceeds the Buy Now price of $${auction.buyNowPrice}. Please use the Buy Now option instead.`
      });
      setShowBidDialog(false);
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    try {
      setBiddingLoading(true);
      await bidsApi.placeBid({ item_id: auction.id, amount });

      const [itemData, bidsData] = await Promise.all([
        itemsApi.getItem(auction.id),
        bidsApi.getItemBids(auction.id),
      ]);

      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: itemData.currently || itemData.first_bid,
              bidHistory: bidsData.map((bid) => ({
                id: bid.id,
                bidderUsername: bid.bidder_username || 'Anonymous',
                amount: bid.amount,
                time: new Date(bid.time).toLocaleString(),
                rating: bid.bidder_rating || undefined,
              })),
              totalBids: bidsData.length,
            }
          : null
      );

      setAlert({ type: 'success', message: `Bid of $${amount} placed successfully!` });
      setShowBidDialog(false);
      setBidAmount('');
    } catch (err: any) {
      console.error('Failed to place bid:', err);
      setAlert({ type: 'error', message: err.message || 'Failed to place bid' });
    } finally {
      setBiddingLoading(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleBuyNow = async () => {
    if (!auction || !auction.buyNowPrice) return;

    try {
      setBiddingLoading(true);

      // Place a bid equal to the buy now price
      const result = await bidsApi.placeBid({
        item_id: auction.id,
        amount: auction.buyNowPrice
      });

      // Check if this was processed as a buy now transaction
      if (result.is_buy_now) {
        setAlert({
          type: 'success',
          message: `Congratulations! You've purchased this item for $${auction.buyNowPrice}. The auction has ended.`
        });
      } else {
        setAlert({
          type: 'success',
          message: `Bid of $${auction.buyNowPrice} placed successfully!`
        });
      }

      // Refresh auction data
      const [itemData, bidsData] = await Promise.all([
        itemsApi.getItem(auction.id),
        bidsApi.getItemBids(auction.id),
      ]);

      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: itemData.currently || itemData.first_bid,
              bidHistory: bidsData.map((bid) => ({
                id: bid.id,
                bidderUsername: bid.bidder_username || 'Anonymous',
                amount: bid.amount,
                time: new Date(bid.time).toLocaleString(),
                rating: bid.bidder_rating || undefined,
              })),
              totalBids: bidsData.length,
              // Update auction status based on fresh data from API
              isActive: itemData.status === 'active' && new Date(itemData.ends) > new Date(),
            }
          : null
      );

      setShowBuyNowDialog(false);
    } catch (err: any) {
      console.error('Failed to complete buy now:', err);
      setAlert({ type: 'error', message: err.message || 'Failed to complete purchase' });
    } finally {
      setBiddingLoading(false);
      // Keep the success message longer for Buy Now since it's a major action
      setTimeout(() => setAlert(null), 8000);
    }
  };

  const handleSendMessage = async () => {
    if (!auction || !messageData.subject || !messageData.content) {
      setAlert({ type: 'error', message: 'Please fill in all required fields.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      setSendingMessage(true);

      await messagesApi.sendMessage({
        receiver_id: auction.sellerId,
        subject: messageData.subject,
        content: messageData.content,
        item_id: auction.id
      });

      setAlert({ type: 'success', message: 'Message sent successfully!' });
      setShowMessageDialog(false);
      setMessageData({ subject: '', content: '' });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setAlert({ type: 'error', message: err.message || 'Failed to send message.' });
    } finally {
      setSendingMessage(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const formatTimeRemaining = (endTime: Date) => {
    // Handle null or undefined endTime
    if (!endTime) {
      return 'No end date';
    }

    const now = new Date();

    // Check if date is valid
    if (isNaN(endTime.getTime()) || isNaN(now.getTime())) {
      return 'Invalid date';
    }

    const timeDiff = endTime.getTime() - now.getTime();
    if (timeDiff <= 0) return 'Auction ended';

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    // Validate calculations
    if (isNaN(days) || isNaN(hours) || isNaN(minutes)) {
      return 'Invalid time';
    }

    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: '2rem' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: '1rem' }}
        >
          Back
        </Button>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: '1rem' }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: '1rem' }}>
              Loading auction details...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: '1rem' }}>
            {error}
          </Alert>
        )}

        {auction && !loading && (
          <Grid container spacing={'2rem'}>
            {/* Left Column */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Image Gallery */}
                <Card sx={{ borderRadius: '1rem', overflow: 'hidden' }}>
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={auction.images[currentImageIndex]}
                      alt={auction.name}
                      sx={{ width: '100%', height: '400px', objectFit: 'cover' }}
                    />
                    <IconButton
                      onClick={handlePreviousImage}
                      sx={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                      }}
                    >
                      <ArrowBack />
                    </IconButton>
                    <IconButton
                      onClick={handleNextImage}
                      sx={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                      }}
                    >
                      <ArrowForward />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: '0.5rem', p: '1rem' }}>
                    {auction.images.map((image, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        sx={{
                          width: '80px',
                          height: '60px',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          border: currentImageIndex === index ? '2px solid' : '2px solid transparent',
                          borderColor: currentImageIndex === index ? 'primary.main' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <Box
                          component="img"
                          src={image}
                          alt={`${auction.name} ${index + 1}`}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Card>

                {/* Map Card */}
                <Card sx={{ borderRadius: '1rem' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '1rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LocationOn color="primary" />
                        <Typography variant="h6">Item Location</Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowMapModal(true)}
                        sx={{ borderRadius: '0.5rem' }}
                      >
                        {auction.latitude && auction.longitude ? 'Expand Map' : 'View Location'}
                      </Button>
                    </Box>

                    <Box sx={{ height: '300px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid', borderColor: 'neutral.slate200' }}>
                      {auction.latitude && auction.longitude ? (
                        <MapContainer center={[auction.latitude, auction.longitude]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <Marker position={[auction.latitude, auction.longitude]}>
                            <Popup>
                              <Box sx={{ p: '0.5rem' }}>
                                <Typography variant="body2" fontWeight={600}>{auction.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{auction.location}</Typography>
                              </Box>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      ) : auction.location ? (
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          backgroundColor: 'grey.50',
                          p: '2rem'
                        }}>
                          <LocationOn sx={{ fontSize: '3rem', color: 'primary.main', mb: '1rem' }} />
                          <Typography variant="h6" fontWeight={600} textAlign="center" gutterBottom>
                            {auction.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" textAlign="center">
                            Precise coordinates not available
                          </Typography>
                          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: '0.5rem' }}>
                            Contact seller for exact location details
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          backgroundColor: 'grey.50',
                          p: '2rem'
                        }}>
                          <LocationOn sx={{ fontSize: '3rem', color: 'text.secondary', mb: '1rem' }} />
                          <Typography variant="h6" color="text.secondary" textAlign="center">
                            Location not specified
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: '0.5rem' }}>
                      Click "Expand Map" for full screen view • Location: {auction.location}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card sx={{ borderRadius: '1rem' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Description</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {auction.description}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Bid History */}
                <Card sx={{ borderRadius: '1rem' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Bid History ({auction.totalBids} bids)</Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Bidder</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Rating</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {auction.bidHistory.map((bid) => (
                            <TableRow key={bid.id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Avatar sx={{ width: '2rem', height: '2rem', backgroundColor: 'primary.main' }}>
                                    {bid.bidderUsername.charAt(0)}
                                  </Avatar>
                                  {bid.bidderUsername}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={600} color="success.main">
                                  ${bid.amount.toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell color="text.secondary">{bid.time}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Rating value={convertToStarRating(bid.rating)} readOnly size="small" />
                                  <Typography variant="body2">{formatRating(bid.rating)}</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={5}>
              <Box sx={{ position: 'sticky', top: '2rem' }}>
                {/* Auction Info */}
                <Card sx={{ borderRadius: '1rem', mb: '2rem' }}>
                  <CardContent sx={{ p: '2rem' }}>
                    <Typography variant="h4" component="h1" gutterBottom>{auction.name}</Typography>

                    <Box sx={{ display: 'flex', gap: '0.5rem', mb: '1.5rem', flexWrap: 'wrap' }}>
                      {auction.categories.map((category) => (
                        <Chip key={category} label={category} size="small" variant="outlined" icon={<LocalOffer />} />
                      ))}
                    </Box>

                    <Divider sx={{ mb: '1.5rem' }} />

                    <Box sx={{ mb: '1.5rem' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Current Price</Typography>
                      <Typography variant="h3" color="primary.main" fontWeight={700}>
                        ${auction.currentPrice.toLocaleString()}
                      </Typography>
                    </Box>

                    {auction.buyNowPrice && (
                      <Box sx={{ mb: '1.5rem' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Buy Now Price</Typography>
                        <Typography variant="h5" color="success.main" fontWeight={600}>
                          ${auction.buyNowPrice.toLocaleString()}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ mb: '1.5rem' }} />

                    <Box sx={{ mb: '2rem' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Time Remaining</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Timer color="warning" />
                        <Typography variant="h6" color="warning.main" fontWeight={600}>
                          {formatTimeRemaining(auction.endTime)}
                        </Typography>
                      </Box>
                    </Box>

                    {user ? (
                      user.id === auction.sellerId ? (
                        <Alert severity="info" sx={{ borderRadius: '0.5rem' }}>
                          <Typography variant="body2">
                            This is your auction. You cannot bid on your own items.
                          </Typography>
                        </Alert>
                      ) : !auction.isActive ? (
                        <>
                          <Alert severity="warning" sx={{ borderRadius: '0.5rem', mb: '1rem' }}>
                            <Typography variant="body2">
                              This auction has ended. No more bids can be placed.
                            </Typography>
                          </Alert>
                          <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Message />}
                            onClick={() => {
                              setMessageData({
                                subject: `Regarding auction: ${auction.name}`,
                                content: ''
                              });
                              setShowMessageDialog(true);
                            }}
                            sx={{ borderRadius: '0.5rem', py: '0.75rem' }}
                            fullWidth
                          >
                            Message Seller
                          </Button>
                        </>
                      ) : (
                      <>
                        <Box sx={{ mb: '1.5rem' }}>
                          <TextField
                            fullWidth
                            label="Your Bid Amount"
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={`Minimum: $${auction.currentPrice + 1}`}
                            InputProps={{ startAdornment: <MonetizationOn sx={{ mr: '0.5rem', color: 'text.secondary' }} /> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
                            helperText={
                              auction.buyNowPrice
                                ? `Minimum bid: $${auction.currentPrice + 1} • Max bid: $${auction.buyNowPrice - 1} (Use Buy Now for $${auction.buyNowPrice}+)`
                                : `Minimum bid: $${auction.currentPrice + 1}`
                            }
                            error={Boolean(auction.buyNowPrice && bidAmount && parseFloat(bidAmount) >= auction.buyNowPrice)}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<Gavel />}
                            onClick={() => setShowBidDialog(true)}
                            disabled={
                              !bidAmount ||
                              parseFloat(bidAmount) <= auction.currentPrice ||
                              Boolean(auction.buyNowPrice && parseFloat(bidAmount) >= auction.buyNowPrice)
                            }
                            sx={{ borderRadius: '0.5rem', py: '0.75rem' }}
                          >
                            Place Bid
                          </Button>

                          {auction.buyNowPrice && (
                            <Button
                              variant="outlined"
                              size="large"
                              startIcon={<ShoppingCart />}
                              onClick={() => setShowBuyNowDialog(true)}
                              sx={{ borderRadius: '0.5rem', py: '0.75rem' }}
                            >
                              Buy Now - ${auction.buyNowPrice.toLocaleString()}
                            </Button>
                          )}
                        </Box>
                      </>
                      )
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: '0.5rem' }}>
                        <Typography variant="body2">
                          Please <Button
                            variant="text"
                            sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                            onClick={() => navigate('/login')}
                          >
                            log in
                          </Button> to place bids on this auction.
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Seller Info */}
                <Card sx={{ borderRadius: '1rem' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Seller Information</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: '1rem' }}>
                      <Avatar sx={{ width: '3rem', height: '3rem', backgroundColor: 'primary.main' }}>
                        {auction.sellerUsername.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{auction.sellerUsername}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Rating value={convertToStarRating(auction.sellerRating)} readOnly size="small" />
                          <Typography variant="body2" color="text.secondary">
                            {auction.sellerRating ? `${formatRating(auction.sellerRating)} rating` : 'No rating yet'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{auction.sellerLocation}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        )}

        {auction && <SimilarItems itemId={auction.id} />}

        {/* Bid Dialog */}
        <Dialog open={showBidDialog} onClose={() => setShowBidDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Your Bid</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: '1rem' }}>
              Are you sure you want to place a bid of <strong>${bidAmount}</strong> on this item?
            </Typography>
            <Alert severity="info">By placing this bid, you enter into a binding agreement to purchase this item if you win.</Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBidDialog(false)} disabled={biddingLoading}>Cancel</Button>
            <Button variant="contained" onClick={handleBidSubmit} disabled={biddingLoading} startIcon={biddingLoading ? <CircularProgress size={20} color="inherit" /> : null}>
              {biddingLoading ? 'Placing Bid...' : 'Confirm Bid'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Buy Now Dialog */}
        <Dialog open={showBuyNowDialog} onClose={() => setShowBuyNowDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: '1rem' }}>
              Are you sure you want to buy this item now for <strong>${auction?.buyNowPrice?.toLocaleString()}</strong>?
            </Typography>
            <Alert severity="warning">This will end the auction immediately and you will win the item.</Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBuyNowDialog(false)} disabled={biddingLoading}>Cancel</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleBuyNow}
              disabled={biddingLoading}
              startIcon={biddingLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {biddingLoading ? 'Processing...' : 'Buy Now'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Map Modal */}
        <Dialog open={showMapModal} onClose={() => setShowMapModal(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '80vh', borderRadius: '1rem' } }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LocationOn color="primary" /> Item Location - {auction?.location}
          </DialogTitle>
          <DialogContent sx={{ p: 0, height: '100%' }}>
            <Box sx={{ height: '100%', width: '100%' }}>
              {auction?.latitude && auction?.longitude ? (
                <MapContainer center={[auction.latitude, auction.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                  <Marker position={[auction.latitude, auction.longitude]}>
                    <Popup>
                      <Box sx={{ p: '1rem', minWidth: '200px' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>{auction.name}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{auction.location}</Typography>
                        <Typography variant="body2">Current Price: <strong>${auction.currentPrice.toLocaleString()}</strong></Typography>
                        <Typography variant="body2">Seller: <strong>{auction.sellerUsername}</strong></Typography>
                      </Box>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : auction?.location ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  backgroundColor: 'grey.50',
                  p: '3rem'
                }}>
                  <LocationOn sx={{ fontSize: '4rem', color: 'primary.main', mb: '2rem' }} />
                  <Typography variant="h4" fontWeight={600} textAlign="center" gutterBottom>
                    {auction.location}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: '1rem' }}>
                    Precise coordinates not available
                  </Typography>
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    Contact seller for exact location details
                  </Typography>
                </Box>
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  backgroundColor: 'grey.50',
                  p: '3rem'
                }}>
                  <LocationOn sx={{ fontSize: '4rem', color: 'text.secondary', mb: '2rem' }} />
                  <Typography variant="h4" color="text.secondary" textAlign="center">
                    Location not specified
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMapModal(false)} variant="contained">Close Map</Button>
          </DialogActions>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={showMessageDialog} onClose={() => setShowMessageDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Message Seller</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: '1rem' }}>
              <TextField
                fullWidth
                label="Subject"
                value={messageData.subject}
                onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                sx={{ mb: '1rem' }}
              />
              <Box sx={{ mb: '1rem' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: '0.5rem' }}>
                  Message
                </Typography>
                <Textarea
                  value={messageData.content}
                  onChange={(e) => setMessageData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your message to the seller..."
                  rows={6}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    resize: 'vertical',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMessageDialog(false)} disabled={sendingMessage}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageData.subject || !messageData.content}
              startIcon={sendingMessage ? <CircularProgress size={20} color="inherit" /> : <Message />}
            >
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AuctionDetail;
