import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
} from '@mui/material';
import {
  Gavel,
  Search,
} from '@mui/icons-material';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleBrowseAuctions = () => {
    navigate('/browse');
  };

  const handleCreateAuction = () => {
    navigate('/create');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: '4rem', textAlign: 'center' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Welcome to Modern E-Auction
        </Typography>
        <Typography variant="h4" color="text.secondary" sx={{ mb: '3rem' }}>
          Your gateway to buying and selling unique items
        </Typography>

        <Grid container spacing={'2rem'} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-0.5rem)',
                  boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: '2rem', textAlign: 'center' }}>
                <Box sx={{ mb: '1.5rem' }}>
                  <Gavel
                    sx={{
                      fontSize: '4rem',
                      color: 'primary.light',
                      mb: '1rem',
                    }}
                  />
                </Box>
                <Typography variant="h3" component="h2" gutterBottom>
                  Manage Auctions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create and manage your auctions with ease. Set up bidding,
                  track progress, and connect with buyers.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: '1.5rem', pt: 0 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleCreateAuction}
                  sx={{
                    py: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Start Selling
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-0.5rem)',
                  boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: '2rem', textAlign: 'center' }}>
                <Box sx={{ mb: '1.5rem' }}>
                  <Search
                    sx={{
                      fontSize: '4rem',
                      color: 'primary.light',
                      mb: '1rem',
                    }}
                  />
                </Box>
                <Typography variant="h3" component="h2" gutterBottom>
                  Browse Auctions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Search and bid on thousands of unique items from trusted sellers
                  around the world.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: '1.5rem', pt: 0 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleBrowseAuctions}
                  sx={{
                    py: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Start Bidding
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Recommended Section Placeholder */}

      </Box>
    </Container>
  );
};

export default HomePage;