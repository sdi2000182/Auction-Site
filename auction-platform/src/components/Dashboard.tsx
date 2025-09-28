import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp,
  Recommend,
  Category,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import RecommendedAuctions from './RecommendedAuctions';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: '2rem' }}>
        {/* Header */}
        <Box sx={{ mb: '3rem', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: '1rem' }}>
            <DashboardIcon sx={{ fontSize: '2.5rem', color: 'primary.main', mr: 1 }} />
            <Typography variant="h2" component="h1" fontWeight={700}>
              {user ? `Welcome back, ${user.firstName}!` : 'Welcome to AuctionHub'}
            </Typography>
          </Box>
          <Typography variant="h5" color="text.secondary">
            {user
              ? 'Discover auctions tailored just for you'
              : 'Explore trending auctions and find amazing deals'
            }
          </Typography>
        </Box>

        {/* Authenticated User Dashboard */}
        {user && (
          <Box>
            {/* Personal Recommendations */}
            <RecommendedAuctions
              type="personal"
              title="🎯 Personalized for You"
              limit={8}
            />

            <Divider sx={{ my: '3rem' }} />

            {/* Category-based Recommendations */}
            <RecommendedAuctions
              type="category"
              title="📂 Based on Your Interests"
              limit={6}
            />

            <Divider sx={{ my: '3rem' }} />

            {/* Trending Items */}
            <RecommendedAuctions
              type="trending"
              title="🔥 Trending Now"
              limit={4}
            />
          </Box>
        )}

        {/* Guest Dashboard */}
        {!user && (
          <Box>
            {/* Trending Items for Guests */}
            <RecommendedAuctions
              type="trending"
              title="🔥 Trending Auctions"
              limit={12}
            />

            {/* Call to Action */}
            <Box sx={{ mt: '4rem', textAlign: 'center' }}>
              <Card sx={{ backgroundColor: 'primary.main', color: 'white', borderRadius: '1rem' }}>
                <CardContent sx={{ py: '3rem' }}>
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    Get Personalized Recommendations
                  </Typography>
                  <Typography variant="body1" sx={{ mb: '2rem', opacity: 0.9 }}>
                    Sign up or log in to get auction recommendations tailored specifically to your interests and bidding history.
                  </Typography>
                  <Grid container spacing={2} justifyContent="center" sx={{ mt: '2rem' }}>
                    <Grid item>
                      <Card sx={{ p: '1rem', textAlign: 'center' }}>
                        <CardContent>
                          <Recommend sx={{ fontSize: '2rem', color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6" fontWeight={600}>
                            AI-Powered
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Machine learning recommendations based on your activity
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item>
                      <Card sx={{ p: '1rem', textAlign: 'center' }}>
                        <CardContent>
                          <Category sx={{ fontSize: '2rem', color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6" fontWeight={600}>
                            Category-Based
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Discover items in categories you love most
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item>
                      <Card sx={{ p: '1rem', textAlign: 'center' }}>
                        <CardContent>
                          <TrendingUp sx={{ fontSize: '2rem', color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6" fontWeight={600}>
                            Trending Items
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Stay updated with what's popular right now
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;