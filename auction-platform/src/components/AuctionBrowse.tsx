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

interface AuctionItem {
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
  location: string;
  country: string;
  timeRemaining?: string;
}

interface Filters {
  searchTerm: string;
  selectedCategories: string[];
  priceMin: string;
  priceMax: string;
  location: string;
}

const categories = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Collectibles',
  'Vehicles',
  'Art',
  'Books',
  'Music',
  'Sports',
  'Jewelry',
  'Tools',
  'Antiques'
];

const AuctionBrowse: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    selectedCategories: [],
    priceMin: '',
    priceMax: '',
    location: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 9;

  // Mock auction data
  const [auctions] = useState<AuctionItem[]>([
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
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'],
      location: 'New York, NY',
      country: 'United States',
      timeRemaining: '5d 12h 30m'
    },
    {
      id: '2',
      itemName: 'Designer Leather Handbag',
      seller: 'Jane Smith',
      sellerId: '2',
      currentBid: 280,
      startPrice: 150,
      buyNowPrice: 450,
      startDate: '2024-03-16T14:00:00Z',
      endDate: '2024-03-23T20:00:00Z',
      status: 'active',
      bidCount: 8,
      category: 'Fashion',
      description: 'Authentic designer leather handbag in excellent condition',
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'],
      location: 'Los Angeles, CA',
      country: 'United States',
      timeRemaining: '6d 8h 15m'
    },
    {
      id: '3',
      itemName: 'Antique Wooden Desk',
      seller: 'Mike Johnson',
      sellerId: '3',
      currentBid: 320,
      startPrice: 200,
      startDate: '2024-03-14T09:00:00Z',
      endDate: '2024-03-21T15:00:00Z',
      status: 'active',
      bidCount: 15,
      category: 'Home & Garden',
      description: 'Beautiful antique oak desk with intricate carvings',
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'],
      location: 'Chicago, IL',
      country: 'United States',
      timeRemaining: '4d 3h 45m'
    },
    {
      id: '4',
      itemName: 'Gaming Console Bundle',
      seller: 'Alex Brown',
      sellerId: '4',
      currentBid: 520,
      startPrice: 300,
      buyNowPrice: 750,
      startDate: '2024-03-17T16:00:00Z',
      endDate: '2024-03-24T22:00:00Z',
      status: 'active',
      bidCount: 22,
      category: 'Electronics',
      description: 'Latest gaming console with accessories and games',
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'],
      location: 'Austin, TX',
      country: 'United States',
      timeRemaining: '7d 10h 20m'
    },
    {
      id: '5',
      itemName: 'Vintage Art Print',
      seller: 'Sarah Wilson',
      sellerId: '5',
      currentBid: 180,
      startPrice: 50,
      startDate: '2024-03-13T11:00:00Z',
      endDate: '2024-03-20T17:00:00Z',
      status: 'active',
      bidCount: 7,
      category: 'Art',
      description: 'Original vintage art print from the 1960s',
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'],
      location: 'Seattle, WA',
      country: 'United States',
      timeRemaining: '3d 5h 10m'
    },
    {
      id: '6',
      itemName: 'Professional Camera Lens',
      seller: 'Tom Davis',
      sellerId: '6',
      currentBid: 650,
      startPrice: 400,
      buyNowPrice: 900,
      startDate: '2024-03-18T08:00:00Z',
      endDate: '2024-03-25T14:00:00Z',
      status: 'active',
      bidCount: 18,
      category: 'Electronics',
      description: 'High-quality professional camera lens in mint condition',
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'],
      location: 'Miami, FL',
      country: 'United States',
      timeRemaining: '8d 2h 35m'
    }
  ]);

  const getFilteredAuctions = () => {
    return auctions.filter(auction => {
      // Search term filter
      const matchesSearch = !filters.searchTerm ||
        auction.itemName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        auction.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        auction.seller.toLowerCase().includes(filters.searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = filters.selectedCategories.length === 0 ||
        filters.selectedCategories.includes(auction.category);

      // Price filter
      const matchesPrice = (!filters.priceMin || auction.currentBid >= parseInt(filters.priceMin)) &&
        (!filters.priceMax || auction.currentBid <= parseInt(filters.priceMax));

      // Location filter
      const matchesLocation = !filters.location ||
        auction.location.toLowerCase().includes(filters.location.toLowerCase()) ||
        auction.country.toLowerCase().includes(filters.location.toLowerCase());

      return matchesSearch && matchesCategory && matchesPrice && matchesLocation;
    });
  };

  const filteredAuctions = getFilteredAuctions();
  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);
  const paginatedAuctions = filteredAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
    }));
    setCurrentPage(1);
  };

  const toggleWatchlist = (auctionId: string) => {
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
                  key={category}
                  control={
                    <Checkbox
                      checked={filters.selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      size="small"
                    />
                  }
                  label={category}
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
              {filteredAuctions.length} auctions found
            </Typography>
          </Box>
        </Box>

        {/* Auction Grid */}
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.3,
                    }}
                  >
                    {auction.itemName}
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

        {/* Pagination */}
        {filteredAuctions.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: '2rem' }}>
            <Pagination
              count={Math.max(1, totalPages)}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              disabled={totalPages <= 1}
            />
          </Box>
        )}

        {/* No Results */}
        {filteredAuctions.length === 0 && (
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