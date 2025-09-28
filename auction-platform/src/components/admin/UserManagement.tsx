import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  Alert,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Download,
  Search,
  FilterList,
  PersonAdd,
  Email,
  Phone,
  LocationOn,
  Business,
} from '@mui/icons-material';
import { usersApi, adminApi } from '../../api';
import type { User } from '../../api/types';


const UserManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

  // Pagination state for backend integration
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all users for client-side pagination and filtering
      const [allUsers, pendingUsersList] = await Promise.all([
        usersApi.getAllUsers(0, 1000), // Fetch a large number to get all users
        usersApi.getPendingUsers()
      ]);

      setUsers(allUsers);
      setPendingUsers(pendingUsersList);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setAlert({ type: 'error', message: 'Failed to load users. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // Only fetch on component mount

  const getFilteredUsers = () => {
    // Combine all users and pending users, removing duplicates
    const allUsersMap = new Map<number, User>();

    // Add all users to the map
    users.forEach(user => {
      allUsersMap.set(user.id, user);
    });

    // Add pending users to the map (this will overwrite if user exists in both)
    pendingUsers.forEach(user => {
      allUsersMap.set(user.id, user);
    });

    const combinedUsers = Array.from(allUsersMap.values());

    return combinedUsers.filter(user => {
      // Determine user status based on the user.status field if available, otherwise use is_approved logic
      const userStatus = user.status || (user.is_approved ? 'approved' : 'pending');
      const matchesStatus = filterStatus === 'all' || userStatus === filterStatus;
      const matchesSearch = searchTerm === '' ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  };


  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleApproveUser = async (userId: number) => {
    try {
      // Call the backend API to approve user
      await usersApi.approveUser({ user_id: userId, is_approved: true });

      // Update local state to reflect the approval
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, is_approved: true, status: 'approved' as const } : user
      ));
      setPendingUsers(prev => prev.filter(user => user.id !== userId));

      setAlert({ type: 'success', message: 'User approved successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error: any) {
      console.error('Failed to approve user:', error);
      setAlert({ type: 'error', message: error.message || 'Failed to approve user. Please try again.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleRejectUser = async (userId: number) => {
    try {
      // Call the backend API to reject user (set is_approved to false)
      await usersApi.approveUser({ user_id: userId, is_approved: false });

      // Update local state to reflect the rejection
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, is_approved: false, status: 'rejected' as const } : user
      ));
      setPendingUsers(prev => prev.filter(user => user.id !== userId));

      setAlert({ type: 'success', message: 'User rejected successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error: any) {
      console.error('Failed to reject user:', error);
      setAlert({ type: 'error', message: error.message || 'Failed to reject user. Please try again.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleExportData = async (format: 'json' | 'xml') => {
    try {
      setLoading(true);
      let blob: Blob;

      if (format === 'xml') {
        blob = await adminApi.exportAuctionsXML();
      } else {
        blob = await adminApi.exportAuctionsJSON();
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auctions.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setAlert({ type: 'success', message: `Data exported as ${format.toUpperCase()} successfully!` });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || `Failed to export ${format.toUpperCase()} data.` });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };



  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Avatar sx={{ width: '2rem', height: '2rem', backgroundColor: 'primary.main' }}>
          {params.row.first_name.charAt(0)}{params.row.last_name.charAt(0)}
        </Avatar>
      ),
    },
    { field: 'username', headerName: 'Username', width: 130 },
    {
      field: 'fullName',
      headerName: 'Full Name',
      width: 180,
      valueGetter: (params) => `${params.row.first_name} ${params.row.last_name}`,
    },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      valueGetter: (params) => {
        // Use status field if available, otherwise derive from is_approved
        return params.row.status || (params.row.is_approved ? 'approved' : 'pending');
      },
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'approved' ? 'secondary' :
            params.value === 'pending' ? 'warning' : 'error'
          }
          size="small"
          sx={{ fontWeight: 500, textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'admin' ? 'primary' : 'default'}
          size="small"
          sx={{ fontWeight: 500, textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="View Details">
              <Visibility />
            </Tooltip>
          }
          label="View"
          onClick={() => handleViewUser(params.row)}
        />,
        ...((!params.row.is_approved) ? [
          <GridActionsCellItem
            icon={
              <Tooltip title="Approve User">
                <CheckCircle />
              </Tooltip>
            }
            label="Approve"
            onClick={() => handleApproveUser(params.row.id)}
            sx={{ color: 'success.main' }}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title="Reject User">
                <Cancel />
              </Tooltip>
            }
            label="Reject"
            onClick={() => handleRejectUser(params.row.id)}
            sx={{ color: 'error.main' }}
          />,
        ] : []),
      ],
    },
  ];

  return (
    <Box>
      {/* Header and Controls */}
      <Box sx={{ mb: '2rem' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: '1.5rem' }}>
          Review user registrations, approve accounts, and manage user data
        </Typography>

        {/* Alert Messages */}
        {alert && (
          <Alert severity={alert.type} sx={{ mb: '1.5rem' }}>
            {alert.message}
          </Alert>
        )}

        {/* Filters and Export */}
        <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: '15rem' }}
            InputProps={{
              startAdornment: <Search sx={{ mr: '0.5rem', color: 'text.secondary' }} />,
            }}
          />

          <TextField
            select
            label="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            sx={{ minWidth: '10rem' }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>

          <Box sx={{ ml: 'auto', display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExportData('json')}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExportData('xml')}
            >
              Export XML
            </Button>
          </Box>
        </Box>
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: '25rem', width: '100%' }}>
        <DataGrid
          rows={getFilteredUsers()}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25, 50]}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'neutral.slate50',
              borderBottom: '2px solid #e0e0e0',
            },
          }}
        />
      </Box>

      {/* User Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Avatar sx={{ backgroundColor: 'primary.main' }}>
              {selectedUser?.first_name.charAt(0)}{selectedUser?.last_name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {selectedUser?.first_name} {selectedUser?.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{selectedUser?.username}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Chip
                label={selectedUser?.status}
                color={
                  selectedUser?.status === 'approved' ? 'success' :
                  selectedUser?.status === 'pending' ? 'warning' : 'error'
                }
                sx={{ fontWeight: 500, textTransform: 'capitalize' }}
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={'1.5rem'} sx={{ mt: '0.5rem' }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Email color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedUser?.email}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedUser?.phone}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Business color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tax ID</Typography>
                    <Typography variant="body1">{selectedUser?.afm}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Location Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LocationOn color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography variant="body1">{selectedUser?.address}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LocationOn color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Location</Typography>
                    <Typography variant="body1">{selectedUser?.location}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LocationOn color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Country</Typography>
                    <Typography variant="body1">{selectedUser?.country}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: '1.5rem' }}>
          {selectedUser?.status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => {
                  handleApproveUser(selectedUser.id);
                  setViewDialogOpen(false);
                }}
              >
                Approve User
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                onClick={() => {
                  handleRejectUser(selectedUser.id);
                  setViewDialogOpen(false);
                }}
              >
                Reject User
              </Button>
            </>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;