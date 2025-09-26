import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';


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
  Paper,
  Alert,
  Avatar,
  Rating,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Gavel,
  Timer,
  LocationOn,
  Person,
  MonetizationOn,
  ShoppingCart,
  ArrowBack,
  ArrowForward,
  Star,
  LocalOffer,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';


// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
interface BidHistory {
  id: string;
  bidderUsername: string;
  amount: number;
  time: string;
  rating: number;
}

interface AuctionDetailData {
  id: string;
  name: string;
  description: string;
  categories: string[];
  currentPrice: number;
  buyNowPrice?: number;
  timeRemaining: string;
  endTime: Date;
  images: string[];
  location: string;
  latitude: number;
  longitude: number;
  sellerUsername: string;
  sellerRating: number;
  sellerLocation: string;
  bidHistory: BidHistory[];
  totalBids: number;
  isActive: boolean;
}

// Mock data - replace with actual API call
const mockAuctionData: AuctionDetailData = {
  id: '1',
  name: 'Vintage Camera Collection - Rare 1960s Leica',
  description: 'This is an exceptional vintage camera collection featuring a rare 1960s Leica camera in excellent condition. The collection includes the original leather case, multiple lenses, and all original documentation. Perfect for collectors or photography enthusiasts who appreciate classic German engineering and craftsmanship.',
  categories: ['Electronics', 'Collectibles', 'Photography'],
  currentPrice: 1250,
  buyNowPrice: 2500,
  timeRemaining: '2d 14h 30m',
  endTime: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000),
  images: [
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
    'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800',
    'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800',
  ],
  location: 'New York, NY',
  latitude: 40.7128,
  longitude: -74.0060,
  sellerUsername: 'VintageCollector',
  sellerRating: 4.8,
  sellerLocation: 'New York, NY',
  totalBids: 15,
  isActive: true,
  bidHistory: [
    { id: '1', bidderUsername: 'PhotoEnthusiast', amount: 1250, time: '2 minutes ago', rating: 4.9 },
    { id: '2', bidderUsername: 'CameraLover', amount: 1200, time: '15 minutes ago', rating: 4.7 },
    { id: '3', bidderUsername: 'VintageHunter', amount: 1150, time: '1 hour ago', rating: 4.5 },
    { id: '4', bidderUsername: 'CollectorPro', amount: 1100, time: '2 hours ago', rating: 4.8 },
    { id: '5', bidderUsername: 'ArtDeco', amount: 1050, time: '3 hours ago', rating: 4.6 },
  ]
};

const AuctionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // In real app, fetch auction data based on id
  const auction = mockAuctionData;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? auction.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === auction.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleBidSubmit = () => {
    const amount = parseFloat(bidAmount);
    if (amount <= auction.currentPrice) {
      setAlert({ type: 'error', message: `Bid must be higher than current price of $${auction.currentPrice}` });
      return;
    }

    setAlert({ type: 'success', message: `Bid of $${amount} placed successfully!` });
    setShowBidDialog(false);
    setBidAmount('');

    // Auto-hide alert
    setTimeout(() => setAlert(null), 3000);
  };

  const handleBuyNow = () => {
    setAlert({ type: 'success', message: `Congratulations! You've purchased this item for $${auction.buyNowPrice}` });
    setShowBuyNowDialog(false);

    // Auto-hide alert
    setTimeout(() => setAlert(null), 3000);
  };

  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const timeDiff = endTime.getTime() - now.getTime();

    if (timeDiff <= 0) return 'Auction ended';

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: '2rem' }}>
        {/* Breadcrumb */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/browse')}
          sx={{ mb: '1rem' }}
        >
          Back to Browse
        </Button>

        {/* Alert */}
        {alert && (
          <Alert severity={alert.type} sx={{ mb: '1rem' }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Grid container spacing={'2rem'}>
          {/* Left Column - 60% */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Image Gallery */}
              <Card sx={{ borderRadius: '1rem', overflow: 'hidden' }}>
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={auction.images[currentImageIndex]}
                    alt={auction.name}
                    sx={{
                      width: '100%',
                      height: '400px',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Navigation Arrows */}
                  <IconButton
                    onClick={handlePreviousImage}
                    sx={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
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
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
                    }}
                  >
                    <ArrowForward />
                  </IconButton>
                </Box>

                {/* Thumbnails */}
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
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Card>

              {/* Interactive Map */}
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
                      Expand Map
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      height: '300px',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'neutral.slate200'
                    }}
                  >
                    <MapContainer
                      center={[auction.latitude, auction.longitude]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[auction.latitude, auction.longitude]}>
                        <Popup>
                          <Box sx={{ p: '0.5rem' }}>
                            <Typography variant="body2" fontWeight={600}>
                              {auction.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {auction.location}
                            </Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: '0.5rem' }}>
                    Click "Expand Map" for full screen view • Location: {auction.location}
                  </Typography>
                </CardContent>
              </Card>

              {/* Description */}
              <Card sx={{ borderRadius: '1rem' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {auction.description}
                  </Typography>
                </CardContent>
              </Card>

              {/* Bid History */}
              <Card sx={{ borderRadius: '1rem' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Bid History ({auction.totalBids} bids)
                  </Typography>
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
                                <Rating value={bid.rating} readOnly size="small" />
                                <Typography variant="body2">{bid.rating}</Typography>
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

          {/* Right Column - 40% Sticky */}
          <Grid item xs={12} md={5}>
            <Box sx={{ position: 'sticky', top: '2rem' }}>
              {/* Auction Info Card */}
              <Card sx={{ borderRadius: '1rem', mb: '2rem' }}>
                <CardContent sx={{ p: '2rem' }}>
                  <Typography variant="h4" component="h1" gutterBottom>
                    {auction.name}
                  </Typography>

                  {/* Categories */}
                  <Box sx={{ display: 'flex', gap: '0.5rem', mb: '1.5rem', flexWrap: 'wrap' }}>
                    {auction.categories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        size="small"
                        variant="outlined"
                        icon={<LocalOffer />}
                      />
                    ))}
                  </Box>

                  <Divider sx={{ mb: '1.5rem' }} />

                  {/* Current Price */}
                  <Box sx={{ mb: '1.5rem' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Price
                    </Typography>
                    <Typography variant="h3" color="primary.main" fontWeight={700}>
                      ${auction.currentPrice.toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Buy Now Price */}
                  {auction.buyNowPrice && (
                    <Box sx={{ mb: '1.5rem' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Buy Now Price
                      </Typography>
                      <Typography variant="h5" color="success.main" fontWeight={600}>
                        ${auction.buyNowPrice.toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ mb: '1.5rem' }} />

                  {/* Time Remaining */}
                  <Box sx={{ mb: '2rem' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Time Remaining
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Timer color="warning" />
                      <Typography variant="h6" color="warning.main" fontWeight={600}>
                        {formatTimeRemaining(auction.endTime)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Bid Input */}
                  <Box sx={{ mb: '1.5rem' }}>
                    <TextField
                      fullWidth
                      label="Your Bid Amount"
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Minimum: $${auction.currentPrice + 1}`}
                      InputProps={{
                        startAdornment: <MonetizationOn sx={{ mr: '0.5rem', color: 'text.secondary' }} />,
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
                      helperText={`Minimum bid: $${auction.currentPrice + 1}`}
                    />
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Gavel />}
                      onClick={() => setShowBidDialog(true)}
                      disabled={!bidAmount || parseFloat(bidAmount) <= auction.currentPrice}
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
                </CardContent>
              </Card>

              {/* Seller Info Card */}
              <Card sx={{ borderRadius: '1rem' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Seller Information
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: '1rem' }}>
                    <Avatar sx={{ width: '3rem', height: '3rem', backgroundColor: 'primary.main' }}>
                      {auction.sellerUsername.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{auction.sellerUsername}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Rating value={auction.sellerRating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {auction.sellerRating} rating
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {auction.sellerLocation}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Bid Confirmation Dialog */}
        <Dialog open={showBidDialog} onClose={() => setShowBidDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Your Bid</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: '1rem' }}>
              Are you sure you want to place a bid of <strong>${bidAmount}</strong> on this item?
            </Typography>
            <Alert severity="info">
              By placing this bid, you enter into a binding agreement to purchase this item if you win.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBidDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleBidSubmit}>
              Confirm Bid
            </Button>
          </DialogActions>
        </Dialog>

        {/* Buy Now Confirmation Dialog */}
        <Dialog open={showBuyNowDialog} onClose={() => setShowBuyNowDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: '1rem' }}>
              Are you sure you want to buy this item now for <strong>${auction.buyNowPrice?.toLocaleString()}</strong>?
            </Typography>
            <Alert severity="warning">
              This will end the auction immediately and you will win the item.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBuyNowDialog(false)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={handleBuyNow}>
              Buy Now
            </Button>
          </DialogActions>
        </Dialog>

        {/* Full Screen Map Modal */}
        <Dialog
          open={showMapModal}
          onClose={() => setShowMapModal(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { height: '80vh', borderRadius: '1rem' }
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LocationOn color="primary" />
            Item Location - {auction.location}
          </DialogTitle>
          <DialogContent sx={{ p: 0, height: '100%' }}>
            <Box sx={{ height: '100%', width: '100%' }}>
              <MapContainer
                center={[auction.latitude, auction.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[auction.latitude, auction.longitude]}>
                  <Popup>
                    <Box sx={{ p: '1rem', minWidth: '200px' }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {auction.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {auction.location}
                      </Typography>
                      <Typography variant="body2">
                        Current Price: <strong>${auction.currentPrice.toLocaleString()}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Seller: <strong>{auction.sellerUsername}</strong>
                      </Typography>
                    </Box>
                  </Popup>
                </Marker>
              </MapContainer>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMapModal(false)} variant="contained">
              Close Map
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AuctionDetail;