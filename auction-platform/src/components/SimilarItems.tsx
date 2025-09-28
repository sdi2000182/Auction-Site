import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Timer,
  MonetizationOn,
  Gavel,
  ArrowForward,
  Visibility,
} from '@mui/icons-material';
import { recommendationsApi } from '../api';
import type { SimilarItem } from '../api/recommendations';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SimilarItemsProps {
  itemId: number;
  limit?: number;
}

const SimilarItems: React.FC<SimilarItemsProps> = ({ itemId, limit = 6 }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [similarItems, setSimilarItems] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSimilarItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recommendationsApi.getSimilarItems(itemId, limit);

        // Filter out auctions by the current user
        const filteredData = data.filter(item =>
          !user || !item.seller || item.seller.id !== user.id
        );

        setSimilarItems(filteredData);
      } catch (err: any) {
        console.error('Failed to load similar items:', err);
        setError('Failed to load similar items');
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      loadSimilarItems();
    }
  }, [itemId, limit]);

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const timeDiff = end.getTime() - now.getTime();

    if (timeDiff <= 0) return 'Ended';

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleItemClick = (auctionId: number) => {
    navigate(`/auction/${auctionId}`);
  };

  if (loading) {
    return (
      <Box sx={{ py: '2rem' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ mr: 1 }} />
          Similar Items
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '2rem' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: '1rem' }}>
            Loading similar items...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: '2rem' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ mr: 1 }} />
          Similar Items
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (similarItems.length === 0) {
    return (
      <Box sx={{ py: '2rem' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ mr: 1 }} />
          Similar Items
        </Typography>
        <Alert severity="info">
          No similar items found for this auction.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: '2rem' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '1.5rem' }}>
        <Typography variant="h5" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ mr: 1 }} />
          Similar Items
        </Typography>
        <Button
          variant="outlined"
          endIcon={<ArrowForward />}
          onClick={() => navigate('/browse')}
          size="small"
        >
          View All
        </Button>
      </Box>

      {/* Similar Items Grid */}
      <Grid container spacing={'1.5rem'}>
        {similarItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
              }}
              onClick={() => handleItemClick(item.id)}
            >
              {/* Image */}
              <CardMedia
                component="div"
                sx={{
                  height: '180px',
                  backgroundColor: 'grey.100',
                  backgroundImage: (item.images && item.images.length > 0)
                    ? `url(${item.images[0]})`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {(!item.images || item.images.length === 0) && (
                  <Typography variant="body2" color="text.secondary">
                    No Image
                  </Typography>
                )}

                {/* Similarity Score Badge */}
                {'similarity_score' in item && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'secondary.main',
                      color: 'white',
                      borderRadius: '12px',
                      px: '8px',
                      py: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {Math.round((item.similarity_score || 0) * 100)}% Similar
                  </Box>
                )}
              </CardMedia>

              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: '1rem' }}>
                {/* Title */}
                <Typography variant="h6" fontWeight={600} gutterBottom noWrap sx={{ fontSize: '1rem' }}>
                  {item.name}
                </Typography>

                {/* Categories */}
                <Box sx={{ mb: '0.75rem' }}>
                  {(item.categories || []).slice(0, 2).map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      size="small"
                      sx={{ mr: '0.5rem', mb: '0.25rem', fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>

                {/* Price */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
                  <MonetizationOn sx={{ fontSize: '1rem', mr: '0.25rem', color: 'success.main' }} />
                  <Typography variant="body1" fontWeight={600} color="success.main">
                    ${item.currently || item.first_bid}
                  </Typography>
                  {item.buy_price && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: '0.5rem' }}>
                      Buy: ${item.buy_price}
                    </Typography>
                  )}
                </Box>

                {/* Time Remaining */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
                  <Timer sx={{ fontSize: '0.9rem', mr: '0.25rem', color: 'warning.main' }} />
                  <Typography variant="caption" color="warning.main" fontWeight={500}>
                    {formatTimeRemaining(item.ends)}
                  </Typography>
                </Box>

                {/* Bid Count */}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                  <Gavel sx={{ fontSize: '0.9rem', mr: '0.25rem', color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {item.number_of_bids || 0} bids
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SimilarItems;