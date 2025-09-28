import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Pagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  AccessTime,
  MonetizationOn,
  Visibility,
  Favorite,
  FavoriteBorder,
  Category,
} from '@mui/icons-material';
import { itemsApi, categoriesApi } from '../api';
import type { ItemSummary, Category as ApiCategory, SearchResult } from '../api/types';
import { getErrorMessage } from '../utils/errorHandling';
import RecommendedAuctions from './RecommendedAuctions';
import { useAuth } from '../context/AuthContext';
import { getAuctionImage, getAuctionImages } from '../utils/imageUtils';

interface AuctionItem {
  id: number;
  itemName: string;
  seller: string;
  sellerId: number;
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
  location: string;
  country: string;
  timeRemaining?: string;
}

interface Filters {
  searchTerm: string;
  selectedCategories: number[];
  priceMin: string;
  priceMax: string;
  location: string;
}


const AuctionBrowse: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    selectedCategories: [],
    priceMin: '',
    priceMax: '',
    location: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const itemsPerPage = 12;

  // Fetch initial data and search auctions
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        const categoriesData = await categoriesApi.getAllCategories();
        setCategories(categoriesData);

        // Initial search with no filters to get active items
        await searchAuctions();
      } catch (err: any) {
        console.error('Failed to fetch initial data:', err);
        setError('Failed to load auctions. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Search auctions when filters change
  useEffect(() => {
    if (!initialLoading) {
      const debounceTimer = setTimeout(() => {
        searchAuctions();
        setCurrentPage(1);
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [filters]);

  // Search auctions when page changes
  useEffect(() => {
    if (!initialLoading) {
      searchAuctions();
    }
  }, [currentPage]);

  const searchAuctions = async () => {
    try {
      setLoading(true);
      setError(null);

      let allResults: any[] = [];
      let totalItems = 0;
      let totalPages = 1;

      if (filters.selectedCategories.length <= 1) {
        // Single or no category - use server-side pagination
        const searchParams = {
          query: filters.searchTerm || undefined,
          category_id: filters.selectedCategories.length > 0 ? filters.selectedCategories[0] : undefined,
          min_price: filters.priceMin ? parseFloat(filters.priceMin) : undefined,
          max_price: filters.priceMax ? parseFloat(filters.priceMax) : undefined,
          location: filters.location || undefined,
          status: 'active' as const,
          page: currentPage,
          size: itemsPerPage,
        };

        const result = await itemsApi.searchItems(searchParams);
        allResults = result.items;
        totalItems = result.total;
        totalPages = result.pages;
      } else {
        // Multiple categories - fetch more items to handle client-side pagination better
        const promises = filters.selectedCategories.map(categoryId =>
          itemsApi.searchItems({
            query: filters.searchTerm || undefined,
            category_id: categoryId,
            min_price: filters.priceMin ? parseFloat(filters.priceMin) : undefined,
            max_price: filters.priceMax ? parseFloat(filters.priceMax) : undefined,
            location: filters.location || undefined,
            status: 'active' as const,
            page: 1,
            size: 500, // Get more items to ensure we have enough for pagination
          })
        );

        const results = await Promise.all(promises);

        // Merge all results and remove duplicates
        const allItems = results.flatMap(result => result.items);
        const uniqueItems = allItems.filter((item, index, self) =>
          index === self.findIndex(i => i.id === item.id)
        );

        // Sort by relevance (newer items first, then by bid count)
        uniqueItems.sort((a, b) => {
          // First prioritize by ID (assuming higher ID = newer)
          if (b.id !== a.id) {
            return b.id - a.id;
          }
          // Then by number of bids (more popular items first)
          return b.number_of_bids - a.number_of_bids;
        });

        // Implement client-side pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        allResults = uniqueItems.slice(startIndex, endIndex);
        totalItems = uniqueItems.length;
        totalPages = Math.ceil(totalItems / itemsPerPage);
      }

      setSearchResult({
        items: allResults,
        total: totalItems,
        page: currentPage,
        size: itemsPerPage,
        pages: totalPages
      });

      // Transform API data to component format
      const transformedItems: AuctionItem[] = allResults.map(item => {
        console.log('Transforming item:', item.id, 'name:', item.name); // Debug log
        return {
          id: item.id,
          itemName: item.name?.trim() || `Auction #${item.id}`,
          seller: item.seller?.username || 'Unknown Seller',
          sellerId: item.seller?.id || 0,
          currentBid: item.currently,
          startPrice: item.currently, // API doesn't have starting price separate
          buyNowPrice: undefined, // Not in search results
          startDate: new Date().toISOString(), // Not in search results
          endDate: item.ends,
          status: item.status,
          bidCount: item.number_of_bids,
          category: item.categories.length > 0 ? item.categories[0].name : 'Uncategorized',
          description: '', // Not in search results
          images: getAuctionImages(item.images || [], item.categories, item.id),
          location: item.location || 'Unknown',
          country: '', // Not in search results
          timeRemaining: formatTimeRemaining(item.ends),
        };
      });

      setAuctions(transformedItems);
    } catch (err: any) {
      console.error('Failed to search auctions:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (endDate: string): string => {
    // Handle null or undefined endDate
    if (!endDate) {
      return 'No end date';
    }

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

  // Use search results directly (server-side filtering)
  const filteredAuctions = auctions;
  const totalPages = searchResult ? searchResult.pages : 1;
  const paginatedAuctions = auctions; // Already paginated by server

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(c => c !== categoryId)
        : [...prev.selectedCategories, categoryId] // Allow multiple category selection
    }));
    setCurrentPage(1);
  };

  const toggleWatchlist = (auctionId: number) => {
    setWatchlist(prev =>
      prev.includes(auctionId)
        ? prev.filter(id => id !== auctionId)
        : [...prev, auctionId]
    );
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      selectedCategories: [],
      priceMin: '',
      priceMax: '',
      location: '',
    });
    setCurrentPage(1);
  };

  if (initialLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: '1rem' }}>
          Loading auctions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'neutral.slate50' }}>
      {/* Left Sidebar - Filters */}
      <Paper
        sx={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '280px',
          height: '100vh',
          p: '1.5rem',
          borderRadius: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '1.5rem' }}>
          <FilterList color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Filters
          </Typography>
          <Button
            size="small"
            onClick={clearFilters}
            sx={{ ml: 'auto', textTransform: 'none' }}
          >
            Clear All
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ mb: '1.5rem' }}>
          <TextField
            fullWidth
            placeholder="Search auctions..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: '0.5rem', color: 'text.secondary' }} />,
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
          />
        </Box>

        {/* Categories */}
        <Box sx={{ mb: '1.5rem', flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Category fontSize="small" />
            Categories
          </Typography>
          <Box sx={{ height: '300px', overflowY: 'auto', pr: '0.5rem' }}>
            <FormGroup>
              {categories.map((category) => (
                <FormControlLabel
                  key={category.id}
                  control={
                    <Checkbox
                      checked={filters.selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      size="small"
                    />
                  }
                  label={category.name}
                  sx={{
                    mb: '0.5rem',
                    '& .MuiFormControlLabel-label': { fontWeight: 400 }
                  }}
                />
              ))}
            </FormGroup>
          </Box>
        </Box>

        {/* Bottom section with fixed height */}
        <Box sx={{ mt: 'auto' }}>
          {/* Price Range */}
          <Box sx={{ mb: '1.5rem' }}>
            <Typography variant="subtitle1" fontWeight={500} sx={{ mb: '0.75rem' }}>
              Price Range
            </Typography>
            <Box sx={{ display: 'flex', gap: '0.75rem' }}>
              <TextField
                size="small"
                label="Min"
                type="number"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
              />
              <TextField
                size="small"
                label="Max"
                type="number"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
              />
            </Box>
          </Box>

          {/* Location */}
          <Box>
            <TextField
              fullWidth
              label="Location"
              placeholder="City, State, or Country"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: '0.5rem', color: 'text.secondary' }} />,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{
        marginLeft: '280px',
        padding: '24px',
        width: 'calc(100% - 280px)'
      }}>
        {/* Results Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '1.5rem' }}>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Browse Auctions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchResult ? `${searchResult.total} auctions found (page ${searchResult.page} of ${searchResult.pages})` : `${filteredAuctions.length} auctions found`}
            </Typography>
          </Box>
        </Box>

        {/* Recommendations Section */}
        {user && (
          <Box sx={{ mb: '3rem' }}>
            <RecommendedAuctions type="personal" limit={10} />
            <RecommendedAuctions type="category" limit={10} />
          </Box>
        )}

        {/* Trending for non-logged-in users */}
        {!user && (
          <Box sx={{ mb: '3rem' }}>
            <RecommendedAuctions type="trending" limit={6} />
          </Box>
        )}

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: '4rem' }}>
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ ml: '1rem' }}>
              Loading auctions...
            </Typography>
          </Box>
        )}

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: '2rem' }}>
            {error}
          </Alert>
        )}

        {/* Auction Grid */}
        {!loading && !error && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: '24px',
              justifyItems: 'center',
              mb: '2rem',
              width: '100%'
            }}
          >
            {/* Auction Cards */}
            {paginatedAuctions.map((auction) => (
            <Card
              key={auction.id}
              onClick={() => navigate(`/auction/${auction.id}`)}
              sx={{
                width: '100%',
                maxWidth: '350px',
                height: '400px',
                borderRadius: '1rem',
                  overflow: 'hidden',
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
                    image={auction.images[0]}
                    alt={auction.itemName}
                    sx={{ objectFit: 'cover' }}
                  />

                  {/* Status Badge */}
                  <Chip
                    label={auction.status === 'active' ? 'Active' : auction.status}
                    color={auction.status === 'active' ? 'success' : 'default'}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      fontWeight: 500,
                    }}
                  />

                  {/* Watchlist Button */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(auction.id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': { backgroundColor: 'white' },
                    }}
                  >
                    {watchlist.includes(auction.id) ? (
                      <Favorite color="error" />
                    ) : (
                      <FavoriteBorder />
                    )}
                  </IconButton>
                </Box>

                <CardContent sx={{ p: '1rem', height: '200px', display: 'flex', flexDirection: 'column' }}>
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
                      minHeight: '4em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.25,
                    }}
                  >
                    {auction.itemName?.trim() || `Auction #${auction.id}`}
                  </Typography>

                  {/* Current Bid */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '0.75rem' }}>
                    <MonetizationOn fontSize="small" color="success" />
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      ${auction.currentBid.toLocaleString()}
                    </Typography>
                    {auction.buyNowPrice && (
                      <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        ${auction.buyNowPrice.toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  {/* Time Remaining */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '0.75rem' }}>
                    <AccessTime fontSize="small" color="warning" />
                    <Typography variant="body2" color="warning.main" fontWeight={500}>
                      {auction.timeRemaining}
                    </Typography>
                  </Box>

                  {/* Location & Bids */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {auction.location}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {auction.bidCount} bids
                    </Typography>
                  </Box>

                  {/* View Details Button */}
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Visibility />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/auction/${auction.id}`);
                    }}
                    sx={{
                      mt: '0.75rem',
                      borderRadius: '0.5rem',
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Pagination */}
        {!loading && !error && filteredAuctions.length > 0 && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: '2rem' }}>
            <Pagination
              count={Math.max(1, totalPages)}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}

        {/* No Results */}
        {!loading && !error && filteredAuctions.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: '4rem',
            }}
          >
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No auctions found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: '1rem' }}>
              Try adjusting your filters or search terms
            </Typography>
            <Button variant="outlined" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AuctionBrowse;