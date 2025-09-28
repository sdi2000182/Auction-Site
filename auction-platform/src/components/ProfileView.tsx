import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Avatar,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputAdornment,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  LocationOn,
  Business,
  Security,
  CameraAlt,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api';
import type { UserUpdate } from '../api/types';

interface ProfileData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  country: string;
  afm: string;
  avatar?: string;
}

const ProfileView: React.FC = () => {
  const { user, checkAuthStatus } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    location: '',
    country: '',
    afm: '',
    avatar: undefined,
  });

  const [editData, setEditData] = useState<ProfileData>({ ...profileData });

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setProfileLoading(true);
        const userData = await usersApi.getCurrentUserProfile();

        const transformedProfile: ProfileData = {
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          location: userData.location || '',
          country: userData.country || '',
          afm: userData.afm || '',
          avatar: undefined,
        };

        setProfileData(transformedProfile);
        setEditData(transformedProfile);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile data');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profileData });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...profileData });
    setError('');
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Basic validation
      if (!editData.firstName || !editData.lastName || !editData.email) {
        setError('First name, last name, and email are required.');
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return;
      }
      console.log('EDIT DATA:', editData);
      // Transform data to API format
      const updateData: UserUpdate = {
        first_name: editData.firstName,
        last_name: editData.lastName,
        email: editData.email,
        phone: editData.phone || undefined,
        address: editData.address || undefined,
        location: editData.location || undefined,
        country: editData.country || undefined,
        afm: editData.afm || undefined,
      };

      // Call API to update profile
      const updatedUser = await usersApi.updateCurrentUser(updateData);

      // Update local state with API response
      const updatedProfile: ProfileData = {
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        address: updatedUser.address || '',
        location: updatedUser.location || '',
        country: updatedUser.country || '',
        afm: updatedUser.afm || '',
        avatar: undefined,
      };

      setProfileData(updatedProfile);
      setEditData(updatedProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');

      // Refresh auth context to reflect changes
      await checkAuthStatus();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditData({ ...editData, [field]: event.target.value });
    setError('');
  };

  const getInitials = () => {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
  };

  const renderField = (
    label: string,
    value: string,
    field: keyof ProfileData,
    icon: React.ReactNode,
    disabled: boolean = false
  ) => {
    if (isEditing && !disabled) {
      return (
        <TextField
          fullWidth
          label={label}
          variant="outlined"
          value={editData[field]}
          onChange={handleChange(field)}
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: '2.75rem',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {icon}
              </InputAdornment>
            ),
          }}
        />
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            {label}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {value || 'Not provided'}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: '1rem' }}>
            Loading profile...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: '2rem' }}>
        {/* Header */}
        <Box sx={{ mb: '2rem', textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Profile Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account information and preferences
          </Typography>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: '2rem' }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: '2rem' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Main Profile Card */}
        <Card
          sx={{
            maxWidth: '56.25rem',
            mx: 'auto',
            borderRadius: '1rem',
            boxShadow: '0 0.25rem 1rem rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ p: '2rem' }}>
            {/* Avatar and Basic Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: '2rem', gap: '2rem' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: '5rem',
                    height: '5rem',
                    backgroundColor: 'primary.main',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                  }}
                  src={profileData.avatar}
                >
                  {getInitials()}
                </Avatar>
                {isEditing && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: '-0.25rem',
                      right: '-0.25rem',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      width: '2rem',
                      height: '2rem',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    <CameraAlt sx={{ fontSize: '1rem' }} />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" component="h2" gutterBottom>
                  {profileData.firstName} {profileData.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: '0.5rem' }}>
                  @{profileData.username}
                </Typography>
                <Chip
                  icon={<Security />}
                  label={user?.role === 'admin' ? 'Administrator' : 'User'}
                  color={user?.role === 'admin' ? 'primary' : 'default'}
                  size="small"
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: '1rem' }}>
                {!isEditing ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={handleEdit}
                    sx={{ minWidth: '7rem' }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      disabled={isLoading}
                      sx={{ minWidth: '5rem' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                      onClick={handleSave}
                      disabled={isLoading}
                      sx={{ minWidth: '5rem' }}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            {/* Profile Information Grid */}
            <Grid container spacing={'2rem'}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom sx={{ mb: '1.5rem', fontWeight: 600 }}>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {renderField('Username', profileData.username, 'username', <Person color="action" />, true)}
                  {renderField('First Name', profileData.firstName, 'firstName', <Person color="action" />)}
                  {renderField('Last Name', profileData.lastName, 'lastName', <Person color="action" />)}
                  {renderField('Email Address', profileData.email, 'email', <Email color="action" />)}
                </Box>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom sx={{ mb: '1.5rem', fontWeight: 600 }}>
                  Contact & Location
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {renderField('Phone Number', profileData.phone, 'phone', <Phone color="action" />)}
                  {renderField('Tax ID (ΑΦΜ)', profileData.afm, 'afm', <Business color="action" />)}
                  {renderField('Address', profileData.address, 'address', <LocationOn color="action" />)}
                  {renderField('Location', profileData.location, 'location', <LocationOn color="action" />)}
                  {renderField('Country', profileData.country, 'country', <LocationOn color="action" />)}
                </Box>
              </Grid>
            </Grid>

            {/* Additional Information Section */}
            <Box sx={{ mt: '3rem', pt: '2rem', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" gutterBottom sx={{ mb: '1rem', fontWeight: 600 }}>
                Account Information
              </Typography>
              <Grid container spacing={'2rem'}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Security color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Account Status
                      </Typography>
                      <Chip
                        label={user?.isApproved ? 'Approved' : 'Pending Approval'}
                        color={user?.isApproved ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Security color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Member Since
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        March 2024
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ProfileView;