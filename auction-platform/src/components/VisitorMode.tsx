import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  Visibility,
  Login,
} from '@mui/icons-material';

// Mock auction data for visitor mode
const mockAuctions = [
  {
    id: 1,
    name: 'Vintage Camera Collection',
    currentPrice: 450,
    timeLeft: '2d 14h 23m',
    bids: 12,
    image: 'https://via.placeholder.com/400x200?text=Vintage+Camera',
    categories: ['Electronics', 'Vintage'],
  },
  {
    id: 2,
    name: 'Handcrafted Wooden Table',
    currentPrice: 280,
    timeLeft: '1d 8h 45m',
    bids: 7,
    image: 'https://via.placeholder.com/400x200?text=Wooden+Table',
    categories: ['Furniture', 'Handmade'],
  },
  {
    id: 3,
    name: 'Rare Book Collection',
    currentPrice: 150,
    timeLeft: '4h 12m',
    bids: 23,
    image: 'https://via.placeholder.com/400x200?text=Book+Collection',
    categories: ['Books', 'Collectibles'],
  },
];

interface VisitorModeProps {
  onLoginClick: () => void;
}

const VisitorMode: React.FC<VisitorModeProps> = ({ onLoginClick }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="lg">
        <Box sx={{ py: '2rem' }}>
        {/* Header with Login CTA */}

        {/* Page Title */}
        <Box sx={{ textAlign: 'center', mb: '3rem' }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Discover Amazing Auctions
          </Typography>
          <Typography variant="h4" color="text.secondary">
            Browse thousands of unique items from trusted sellers
          </Typography>
        </Box>

        {/* Featured Auctions Grid */}
        <Typography variant="h2" component="h2" gutterBottom sx={{ mb: '2rem' }}>
          Featured Auctions
        </Typography>

        <Grid container spacing={'2rem'}>
          {mockAuctions.map((auction) => (
            <Grid item xs={12} md={4} key={auction.id}>
              <Card
                sx={{
                  height: '25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-0.25rem)',
                    boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: '12.5rem',
                    backgroundColor: 'neutral.slate200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {auction.name}
                  </Typography>
                </CardMedia>

                <CardContent sx={{ flexGrow: 1, p: '1.5rem' }}>
                  <Typography variant="h4" component="h3" gutterBottom>
                    {auction.name}
                  </Typography>

                  <Box sx={{ mb: '1rem' }}>
                    {auction.categories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        size="small"
                        sx={{ mr: '0.5rem', mb: '0.5rem' }}
                      />
                    ))}
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: '1rem',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Current Price
                      </Typography>
                      <Typography variant="h3" color="primary.main">
                        ${auction.currentPrice}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}
                      >
                        <AccessTime sx={{ fontSize: '1rem', mr: '0.25rem' }} />
                        {auction.timeLeft}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Visibility sx={{ fontSize: '1rem', mr: '0.25rem' }} />
                        {auction.bids} bids
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Login />}
                    onClick={onLoginClick}
                    sx={{ mt: 'auto' }}
                  >
                    Login to Bid
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        </Box>
      </Container>

      {/* Call to Action Section - Full Width */}
      <Box
        sx={{
          mt: '4rem',
          py: '4rem',
          px: '2rem',
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          textAlign: 'center',
          color: 'white',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      >
        <Typography variant="h1" component="h2" gutterBottom sx={{ fontSize: '3rem', fontWeight: 700 }}>
          Ready to Start Bidding?
        </Typography>
        <Typography variant="h3" sx={{ mb: '2rem', opacity: 0.9, fontSize: '1.5rem' }}>
          Join thousands of users in our secure auction platform
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={onLoginClick}
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            py: '1rem',
            px: '3rem',
            fontSize: '1.25rem',
            fontWeight: 600,
            borderRadius: '0.5rem',
            '&:hover': {
              backgroundColor: 'neutral.slate50',
              transform: 'scale(1.05)',
            },
          }}
        >
          Get Started Today
        </Button>
      </Box>
    </Box>
  );
};

export default VisitorMode;