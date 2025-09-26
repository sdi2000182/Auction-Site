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

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  country: string;
  tin: string;
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
}

const UserManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination state for backend integration
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

  // Mock user data - in real app would come from API
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'john_doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, Apt 4B',
      location: 'New York, NY 10001',
      country: 'United States',
      tin: '123-45-6789',
      registrationDate: '2024-03-15',
      status: 'pending',
      role: 'user',
    },
    {
      id: '2',
      username: 'jane_smith',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 987-6543',
      address: '456 Oak Ave',
      location: 'Los Angeles, CA 90210',
      country: 'United States',
      tin: '987-65-4321',
      registrationDate: '2024-03-10',
      status: 'approved',
      role: 'user',
    },
    {
      id: '3',
      username: 'mike_admin',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      phone: '+1 (555) 456-7890',
      address: '789 Pine St',
      location: 'Chicago, IL 60601',
      country: 'United States',
      tin: '456-78-9012',
      registrationDate: '2024-02-20',
      status: 'approved',
      role: 'admin',
    },
    {
      id: '4',
      username: 'alice_wilson',
      firstName: 'Alice',
      lastName: 'Wilson',
      email: 'alice.wilson@example.com',
      phone: '+1 (555) 321-0987',
      address: '321 Elm St',
      location: 'Miami, FL 33101',
      country: 'United States',
      tin: '321-09-8765',
      registrationDate: '2024-03-18',
      status: 'rejected',
      role: 'user',
    },
  ]);

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  };

  // Update total rows when users or filters change
  useEffect(() => {
    const filtered = getFilteredUsers();
    setTotalRows(filtered.length);
  }, [users, filterStatus, searchTerm]);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleApproveUser = async (userId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, status: 'approved' as const } : user
      ));

      setAlert({ type: 'success', message: 'User approved successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to approve user. Please try again.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, status: 'rejected' as const } : user
      ));

      setAlert({ type: 'success', message: 'User rejected successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to reject user. Please try again.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleExportData = (format: 'json' | 'xml') => {
    const filteredUsers = getFilteredUsers();

    if (format === 'json') {
      const dataStr = JSON.stringify(filteredUsers, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users.json';
      link.click();
    } else {
      // XML export
      const xmlStr = generateXML(filteredUsers);
      const dataBlob = new Blob([xmlStr], { type: 'application/xml' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users.xml';
      link.click();
    }

    setAlert({ type: 'success', message: `Data exported as ${format.toUpperCase()} successfully!` });
    setTimeout(() => setAlert(null), 3000);
  };

  const generateXML = (users: User[]) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<users>\n';
    users.forEach(user => {
      xml += '  <user>\n';
      Object.entries(user).forEach(([key, value]) => {
        xml += `    <${key}>${value}</${key}>\n`;
      });
      xml += '  </user>\n';
    });
    xml += '</users>';
    return xml;
  };


  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Avatar sx={{ width: '2rem', height: '2rem', backgroundColor: 'primary.main' }}>
          {params.row.firstName.charAt(0)}{params.row.lastName.charAt(0)}
        </Avatar>
      ),
    },
    { field: 'username', headerName: 'Username', width: 130 },
    {
      field: 'fullName',
      headerName: 'Full Name',
      width: 180,
      valueGetter: (params) => `${params.row.firstName} ${params.row.lastName}`,
    },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'registrationDate',
      headerName: 'Registration Date',
      width: 140,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'approved' ? 'success' :
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
        ...(params.row.status === 'pending' ? [
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
          rowCount={totalRows}
          paginationMode="server"
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
              {selectedUser?.firstName.charAt(0)}{selectedUser?.lastName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {selectedUser?.firstName} {selectedUser?.lastName}
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
                    <Typography variant="body1">{selectedUser?.tin}</Typography>
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