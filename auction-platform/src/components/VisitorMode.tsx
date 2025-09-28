import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
} from '@mui/material';
import {
  AccessTime,
  Visibility,
  Login,
} from '@mui/icons-material';
import { itemsApi } from '../api';
import type { Item } from '../api/types';

interface VisitorAuction {
  id: number;
  name: string;
  currentPrice: number;
  timeLeft: string;
  bids: number;
  image: string;
  categories: string[];
}

interface VisitorModeProps {
  onLoginClick: () => void;
}

const VisitorMode: React.FC<VisitorModeProps> = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<VisitorAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load featured auctions for visitors
  useEffect(() => {
    const loadFeaturedAuctions = async () => {
      try {
        setLoading(true);
        // Get active auctions, limited to 6 for featured display
        const result = await itemsApi.searchItems({
          status: 'active',
          page: 1,
          size: 6
        });

        // Transform API data to visitor format
        const transformedAuctions: VisitorAuction[] = result.items.map(item => {
          // Calculate time remaining
          const endTime = new Date(item.ends);
          const now = new Date();
          const timeDiff = endTime.getTime() - now.getTime();

          let timeLeft = 'Ended';
          if (timeDiff > 0) {
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            timeLeft = `${days}d ${hours}h ${minutes}m`;
          }

          return {
            id: item.id,
            name: item.name,
            currentPrice: item.currently || item.first_bid || 0,
            timeLeft,
            bids: item.number_of_bids || 0,
            image: item.images && item.images.length > 0
              ? item.images[0]
              : `https://picsum.photos/400/200?random=${item.id}`,
            categories: item.categories.map(cat => cat.name)
          };
        });

        setAuctions(transformedAuctions);
      } catch (err: any) {
        console.error('Failed to load featured auctions:', err);
        setError('Failed to load featured auctions');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedAuctions();
  }, []);

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

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '20rem' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: '1rem' }}>
              Loading featured auctions...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: '2rem' }}>
            {error}
          </Alert>
        )}

        {/* Auctions Grid */}
        {!loading && !error && (
        <Grid container spacing={'2rem'}>
          {auctions.map((auction) => (
            <Grid item xs={12} md={4} key={auction.id}>
              <Card
                sx={{
                  height: '28rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-0.25rem)',
                    boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.15)',
                  },
                }}
                onClick={() => navigate(`/auction/${auction.id}`)}
              >
                <CardMedia
                  component="img"
                  sx={{
                    height: '12.5rem',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                  image={auction.image}
                  alt={auction.name}
                />

                <CardContent sx={{ flexGrow: 1, p: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}
                  >
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
                        ${Math.round(auction.currentPrice)}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoginClick();
                    }}
                    sx={{ mt: 'auto', flexShrink: 0 }}
                  >
                    Login to Bid
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        )}

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