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
  Rating,
} from '@mui/material';
import {
  Timer,
  MonetizationOn,
  Gavel,
  TrendingUp,
  Recommend,
  Category,
} from '@mui/icons-material';
import { recommendationsApi } from '../api';
import type { RecommendedItem } from '../api/recommendations';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAuctionImage } from '../utils/imageUtils';

interface RecommendedAuctionsProps {
  type: 'personal' | 'category' | 'trending';
  title?: string;
  limit?: number;
  showHeader?: boolean;
}

const RecommendedAuctions: React.FC<RecommendedAuctionsProps> = ({
  type,
  title,
  limit = 20,
  showHeader = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate title if not provided
  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'personal': return '🎯 Recommended for You';
      case 'category': return '📂 Based on Your Interests';
      case 'trending': return '🔥 Trending Auctions';
      default: return 'Recommended Auctions';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'personal': return <Recommend sx={{ mr: 1 }} />;
      case 'category': return <Category sx={{ mr: 1 }} />;
      case 'trending': return <TrendingUp sx={{ mr: 1 }} />;
      default: return <Gavel sx={{ mr: 1 }} />;
    }
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      if (type === 'personal' && !user) {
        setLoading(false);
        return; // Don't load personal recommendations for non-logged-in users
      }

      try {
        setLoading(true);
        let data: RecommendedItem[] = [];

        switch (type) {
          case 'personal':
            data = await recommendationsApi.getUserRecommendations(limit);
            break;
          case 'category':
            data = await recommendationsApi.getCategoryRecommendations(limit);
            break;
          case 'trending':
            data = await recommendationsApi.getTrendingItems(limit);
            break;
        }

        // Debug raw data from API
        console.log(`Raw ${type} recommendations data:`, data);
        console.log('Current user:', user);

        // Validate and sanitize data to prevent undefined errors
        const sanitizedData = data.map((item, index) => {
          const sanitized = {
            ...item,
            categories: item.categories || [],
            images: item.images || [],
            seller: item.seller || { id: 0, username: 'Unknown' },
          };
          console.log(`Item ${index}:`, {
            id: sanitized.id,
            name: sanitized.name,
            seller: sanitized.seller,
            isUserMatch: user && sanitized.seller && (sanitized.seller.id === user.id || sanitized.seller.id.toString() === user.id.toString())
          });
          return sanitized;
        });

        // Filter out auctions by the current user
        console.log('Current user ID:', user?.id, 'type:', typeof user?.id);
        console.log('Before filtering - total items:', sanitizedData.length);

        const filteredData = sanitizedData.filter(item => {
          // Multiple checks to ensure we filter out user's own auctions
          if (!user || !item.seller) {
            return true; // Keep items if no user or no seller info
          }

          const sellerId = item.seller.id;
          const userId = user.id;

          // Check multiple comparison methods
          const isOwnAuction =
            sellerId === userId ||                          // Direct comparison
            Number(sellerId) === Number(userId) ||         // Force number comparison
            String(sellerId) === String(userId) ||         // Force string comparison
            sellerId.toString() === userId.toString();     // ToString comparison

          if (isOwnAuction) {
            console.log('🚫 Filtering out own auction:', item.name, 'seller ID:', sellerId, 'user ID:', userId);
          }

          return !isOwnAuction;
        });

        console.log('After filtering - remaining items:', filteredData.length);
        console.log('Final filtered data:', filteredData.map(item => ({ id: item.id, name: item.name, sellerId: item.seller?.id })));

        setRecommendations(filteredData);
      } catch (err: any) {
        console.error(`Failed to load ${type} recommendations:`, err);
        setError(`Failed to load recommendations`);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [type, limit, user]);

  const formatTimeRemaining = (endTime: string) => {
    // Handle null or undefined endTime
    if (!endTime) {
      return 'No end date';
    }

    const now = new Date();
    const end = new Date(endTime);

    // Check if date is valid
    if (isNaN(end.getTime()) || isNaN(now.getTime())) {
      return 'Invalid date';
    }

    const timeDiff = end.getTime() - now.getTime();

    if (timeDiff <= 0) return 'Ended';

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    // Validate calculations
    if (isNaN(days) || isNaN(hours) || isNaN(minutes)) {
      return 'Invalid time';
    }

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleAuctionClick = (auctionId: number) => {
    navigate(`/auction/${auctionId}`);
  };

  // Don't render personal recommendations for non-logged-in users
  if (type === 'personal' && !user) {
    return null;
  }

  return (
    <Box sx={{ mb: '2rem' }}>
      {/* Header */}
      {showHeader && (
        <Box sx={{ mb: '1.5rem', display: 'flex', alignItems: 'center' }}>
          {getIcon()}
          <Typography variant="h4" component="h2" fontWeight={600}>
            {getTitle()}
          </Typography>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '2rem' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: '1rem' }}>
            Loading recommendations...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: '1rem' }}>
          {error}
        </Alert>
      )}

      {/* No Recommendations */}
      {!loading && !error && recommendations.length === 0 && (
        <Alert severity="info">
          {type === 'personal'
            ? 'Start bidding on auctions to get personalized recommendations!'
            : 'No recommendations available at the moment.'}
        </Alert>
      )}

      {/* Recommendations Grid */}
      {!loading && !error && recommendations.length > 0 && (
        <Grid container spacing={'1.5rem'}>
          {(recommendations || []).map((auction) => (
            <Grid item xs={12} sm={6} md={4} key={auction.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  },
                }}
                onClick={() => handleAuctionClick(auction.id)}
              >
                {/* Image */}
                <CardMedia
                  component="div"
                  sx={{
                    height: '200px',
                    backgroundColor: 'grey.100',
                    backgroundImage: `url(${getAuctionImage(auction.images, auction.categories, auction.id)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >

                  {/* Recommendation Score Badge */}
                  {'recommendation_score' in auction && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: '12px',
                        px: '8px',
                        py: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {Math.round((auction.recommendation_score || 0) * 100)}% Match
                    </Box>
                  )}
                </CardMedia>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Title */}
                  <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                    {auction.name}
                  </Typography>

                  {/* Categories */}
                  <Box sx={{ mb: '1rem' }}>
                    {(auction.categories || []).slice(0, 2).map((category) => (
                      <Chip
                        key={category.id}
                        label={category.name}
                        size="small"
                        sx={{ mr: '0.5rem', mb: '0.5rem' }}
                      />
                    ))}
                  </Box>

                  {/* Price */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
                    <MonetizationOn sx={{ fontSize: '1.2rem', mr: '0.5rem', color: 'success.main' }} />
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      ${auction.currently || auction.first_bid}
                    </Typography>
                    {auction.buy_price && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: '0.5rem' }}>
                        Buy Now: ${auction.buy_price}
                      </Typography>
                    )}
                  </Box>

                  {/* Time Remaining */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: '0.5rem' }}>
                    <Timer sx={{ fontSize: '1rem', mr: '0.5rem', color: 'warning.main' }} />
                    <Typography variant="body2" color="warning.main" fontWeight={500}>
                      {formatTimeRemaining(auction.ends)}
                    </Typography>
                  </Box>

                  {/* Bid Count */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
                    <Gavel sx={{ fontSize: '1rem', mr: '0.5rem', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {auction.number_of_bids || 0} bids
                    </Typography>
                  </Box>

                  {/* View Button */}
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: '1rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAuctionClick(auction.id);
                    }}
                  >
                    View Auction
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RecommendedAuctions;