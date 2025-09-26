import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  Autocomplete,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add,
  PhotoCamera,
  LocationOn,
  Visibility,
  MonetizationOn,
  Schedule,
  Gavel,
  Edit,
  Close,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auction-tabpanel-${index}`}
      aria-labelledby={`auction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: '1.5rem' }}>{children}</Box>}
    </div>
  );
}

interface AuctionFormData {
  name: string;
  categories: string[];
  firstBid: string;
  buyPrice: string;
  startDate: Date | null;
  endDate: Date | null;
  description: string;
  location: string;
  country: string;
  latitude: string;
  longitude: string;
  images: File[];
}

interface ActiveAuction {
  id: string;
  itemName: string;
  currentPrice: number;
  bidCount: number;
  timeRemaining: string;
  status: 'active' | 'ending_soon';
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
  'Antiques',
];

const countries = [
  { code: 'US', name: 'United States', coordinates: [39.8283, -98.5795] },
  { code: 'GB', name: 'United Kingdom', coordinates: [55.3781, -3.436] },
  { code: 'DE', name: 'Germany', coordinates: [51.1657, 10.4515] },
  { code: 'FR', name: 'France', coordinates: [46.2276, 2.2137] },
  { code: 'IT', name: 'Italy', coordinates: [41.8719, 12.5674] },
  { code: 'ES', name: 'Spain', coordinates: [40.4637, -3.7492] },
  { code: 'CA', name: 'Canada', coordinates: [56.1304, -106.3468] },
  { code: 'AU', name: 'Australia', coordinates: [-25.2744, 133.7751] },
  { code: 'JP', name: 'Japan', coordinates: [36.2048, 138.2529] },
  { code: 'MX', name: 'Mexico', coordinates: [23.6345, -102.5528] },
  { code: 'BR', name: 'Brazil', coordinates: [-14.235, -51.9253] },
  { code: 'IN', name: 'India', coordinates: [20.5937, 78.9629] },
  { code: 'CN', name: 'China', coordinates: [35.8617, 104.1954] },
  { code: 'RU', name: 'Russia', coordinates: [61.524, 105.3188] },
  { code: 'GR', name: 'Greece', coordinates: [39.0742, 21.8243] },
];

// Mock data for editing
const mockAuctionData: { [key: string]: AuctionFormData } = {
  '1': {
    name: 'Vintage Camera Collection - Rare 1960s Leica',
    categories: ['Electronics', 'Collectibles'],
    firstBid: '500',
    buyPrice: '2500',
    startDate: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 9.5 * 24 * 60 * 60 * 1000),
    description:
      'Exceptional vintage camera collection featuring a rare 1960s Leica in excellent condition. Perfect for collectors.',
    location: 'New York, NY',
    country: 'United States',
    latitude: '39.8283',
    longitude: '-98.5795',
    images: [],
  },
  '2': {
    name: 'Gaming Console Bundle with Games',
    categories: ['Electronics'],
    firstBid: '300',
    buyPrice: '',
    startDate: new Date(Date.now() + 5.25 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    description: 'Complete gaming setup with controller and popular games. Perfect condition.',
    location: 'Los Angeles, CA',
    country: 'United States',
    latitude: '39.8283',
    longitude: '-98.5795',
    images: [],
  },
};

const AuctionCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [tabValue, setTabValue] = useState(0);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<AuctionFormData>({
    name: '',
    categories: [],
    firstBid: '',
    buyPrice: '',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    description: '',
    location: '',
    country: '',
    latitude: '',
    longitude: '',
    images: [],
  });

  const [activeAuctions] = useState<ActiveAuction[]>([
    { id: '1', itemName: 'Vintage Camera Collection', currentPrice: 450, bidCount: 12, timeRemaining: '5d 12h 30m', status: 'active' },
    { id: '2', itemName: 'Gaming Console Bundle', currentPrice: 520, bidCount: 22, timeRemaining: '2h 15m', status: 'ending_soon' },
    { id: '3', itemName: 'Professional Camera Lens', currentPrice: 650, bidCount: 18, timeRemaining: '8d 2h 35m', status: 'active' },
  ]);

  useEffect(() => {
    if (isEditMode && id && mockAuctionData[id]) {
      setFormData(mockAuctionData[id]);
    }
  }, [isEditMode, id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);
  const handleInputChange = useCallback((field: keyof AuctionFormData, value: any) => setFormData(prev => ({ ...prev, [field]: value })), []);

  const handleCountryChange = (countryName: string) => {
    const selectedCountry = countries.find(c => c.name === countryName);
    if (selectedCountry) {
      setFormData(prev => ({
        ...prev,
        country: countryName,
        latitude: selectedCountry.coordinates[0].toString(),
        longitude: selectedCountry.coordinates[1].toString(),
      }));
    } else setFormData(prev => ({ ...prev, country: countryName, latitude: '', longitude: '' }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages].slice(0, 10) }));
    }
  };

  const handleRemoveImage = (index: number) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const handleSaveAuction = () => {
    const requiredFields: (keyof AuctionFormData)[] = ['name','categories','firstBid','startDate','endDate','description','location','country'];
    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      if (field === 'categories') return (value as string[]).length === 0;
      return !value;
    });
    if (missingFields.length > 0) return setAlert({ type: 'error', message: 'Please fill in all required fields.' });
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) return setAlert({ type: 'error', message: 'End date must be after start date.' });
    if (formData.buyPrice && parseFloat(formData.buyPrice) <= parseFloat(formData.firstBid)) return setAlert({ type: 'error', message: 'Buy Now price must be higher than First Bid.' });
    if (!isEditMode && formData.images.length === 0) return setAlert({ type: 'error', message: 'Please upload at least one photo.' });

    setAlert({ type: 'success', message: isEditMode ? 'Auction updated successfully!' : 'Auction created successfully!' });

    if (isEditMode) setTimeout(() => navigate('/my-auctions'), 1500);
    else setFormData({
      name: '', categories: [], firstBid: '', buyPrice: '',
      startDate: new Date(Date.now() + 24*60*60*1000), endDate: new Date(Date.now()+7*24*60*60*1000),
      description: '', location:'', country:'', latitude:'', longitude:'', images:[]
    });

    setTimeout(() => setAlert(null), 3000);
  };

  const handleViewBids = (auctionId: string) => console.log('View bids for auction:', auctionId);

  const activeAuctionsColumns: GridColDef[] = [
    { field: 'itemName', headerName: 'Item Name', width: 200 },
    { field: 'currentPrice', headerName: 'Current Price', width: 130, renderCell: (params) => (
      <Box sx={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <MonetizationOn fontSize="small" color="success"/>
        <Typography variant="body2" fontWeight={600} color="success.main">${params.value.toLocaleString()}</Typography>
      </Box>
    ) },
    { field: 'bidCount', headerName: 'Bids', width: 80 },
    { field: 'timeRemaining', headerName: 'Time Remaining', width: 150, renderCell: (params) => (
      <Chip label={params.value} size="small" color={params.row.status==='ending_soon'?'warning':'success'} icon={<Schedule/>}/>
    ) },
    { field: 'actions', type:'actions', headerName:'Actions', width:120, getActions: (params) => [
      <GridActionsCellItem key="view" icon={<Tooltip title="View Bids"><Visibility/></Tooltip>} label="View Bids" onClick={()=>handleViewBids(params.id as string)}/>
    ] },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Box sx={{ py:'2rem' }}>
          <Box sx={{ mb:'2rem' }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:'1rem', mb:'1rem' }}>
              {isEditMode?<Edit sx={{fontSize:'2rem', color:'primary.main'}}/>:<Gavel sx={{fontSize:'2rem', color:'primary.main'}}/>}
              <Typography variant="h2">{isEditMode?'Edit Auction':'Auction Management'}</Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              {isEditMode?'Update your auction details and settings':'Create new auctions, manage active listings, and track your selling activity'}
            </Typography>
          </Box>

          {alert && <Alert severity={alert.type} sx={{mb:'1rem'}} onClose={()=>setAlert(null)}>{alert.message}</Alert>}

          <Paper sx={{ borderRadius:'1rem', overflow:'hidden' }}>
            {!isEditMode && (
              <Box sx={{ borderBottom:1, borderColor:'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{'& .MuiTab-root':{py:'1rem', fontSize:'1rem', fontWeight:500}}}>
                  <Tab icon={<Add/>} label="Create New Auction" id="auction-tab-0" aria-controls="auction-tabpanel-0" iconPosition="start"/>
                  <Tab icon={<Gavel/>} label="Active Auctions" id="auction-tab-1" aria-controls="auction-tabpanel-1" iconPosition="start"/>
                </Tabs>
              </Box>
            )}

            <Box sx={{p:'1.5rem'}}>
              {(isEditMode || tabValue===0) && (
                <>
                  {/* Auction Form Grid */}
                  <Grid container spacing={'2rem'}>
                    {/* Left Column */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                        {/* Name */}
                        <TextField fullWidth label="Item Name" value={formData.name} onChange={(e)=>handleInputChange('name', e.target.value)} required sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}}/>
                        {/* Categories */}
                        <Autocomplete
                          multiple
                          options={categories}
                          value={formData.categories}
                          onChange={(_, newValue) => handleInputChange('categories', newValue)}
                          size="medium"
                          limitTags={3}
                          renderTags={(value, getTagProps)=>value.map((option,index)=>(
                            <Chip variant="outlined" label={option} size="small" {...getTagProps({index})}/>
                          ))}
                          renderInput={(params)=>(
                            <TextField {...params} label="Categories" placeholder="Select categories..." required sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem', minHeight:'56px', maxHeight:'none', '& .MuiAutocomplete-inputRoot':{flexWrap:'wrap', maxHeight:'120px', overflowY:'auto'}}}}/>
                          )}
                          sx={{'& .MuiAutocomplete-inputRoot':{flexWrap:'wrap'}}}
                        />
                        {/* First Bid */}
                        <TextField fullWidth label="First Bid ($)" type="number" value={formData.firstBid} onChange={(e)=>handleInputChange('firstBid', e.target.value)} required inputProps={{min:0, step:0.01}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}}/>
                        {/* Buy Now */}
                        <TextField fullWidth label="Buy Now Price ($) - Optional" type="number" value={formData.buyPrice} onChange={(e)=>handleInputChange('buyPrice', e.target.value)} inputProps={{min:0, step:0.01}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}}/>
                        {/* Start Date */}
                        <DateTimePicker
                          label="Start Date/Time"
                          value={formData.startDate}
                          onChange={(newValue)=>handleInputChange('startDate', newValue)}
                          minDateTime={new Date(Date.now()+5*60*1000)}
                          slotProps={{textField:{fullWidth:true, required:true, sx:{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}}}}
                        />
                        {/* End Date */}
                        <DateTimePicker
                          label="End Date/Time"
                          value={formData.endDate}
                          onChange={(newValue)=>handleInputChange('endDate', newValue)}
                          minDateTime={formData.startDate?new Date(formData.startDate.getTime()+60*60*1000):new Date(Date.now()+65*60*1000)}
                          slotProps={{textField:{fullWidth:true, required:true, sx:{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}}}}
                        />
                      </Box>
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                        {/* Description */}
                        <TextField fullWidth label="Description" multiline rows={8} value={formData.description} onChange={(e)=>handleInputChange('description', e.target.value)} required placeholder="Describe your item in detail..." inputProps={{maxLength:2000}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem', minHeight:'200px'}}} helperText={`${formData.description.length}/2000 characters`}/>

                        {/* Location */}
                        <TextField fullWidth label="Location" value={formData.location} onChange={(e)=>handleInputChange('location', e.target.value)} required InputProps={{startAdornment:<LocationOn sx={{mr:'0.5rem', color:'text.secondary'}}/>}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}}/>

                        {/* Country */}
                        <Autocomplete
                          options={countries.map(c=>c.name)}
                          value={formData.country}
                          onChange={(_, newValue)=>handleCountryChange(newValue||'')}
                          renderInput={(params)=><TextField {...params} label="Country" required sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}}/>}
                          renderOption={(props, option)=>{
                            const country = countries.find(c=>c.name===option);
                            return (
                              <Box component="li" {...props} sx={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                                <Box sx={{width:'20px', height:'15px', borderRadius:'2px', backgroundColor:'primary.main', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'white', fontWeight:'bold'}}>{country?.code}</Box>
                                {option}
                              </Box>
                            );
                          }}
                        />

                        {/* Lat/Long */}
                        <Box sx={{display:'flex', gap:'1rem'}}>
                          <TextField fullWidth label="Latitude" value={formData.latitude} onChange={(e)=>handleInputChange('latitude', e.target.value)} placeholder="Auto-filled from country" helperText={formData.latitude?"Auto-filled from country selection":"Select a country to auto-fill"} InputProps={{readOnly:!!formData.country && !!countries.find(c=>c.name===formData.country)}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem', backgroundColor:formData.latitude?'action.hover':'transparent'}}}/>
                          <TextField fullWidth label="Longitude" value={formData.longitude} onChange={(e)=>handleInputChange('longitude', e.target.value)} placeholder="Auto-filled from country" helperText={formData.longitude?"Auto-filled from country selection":"Select a country to auto-fill"} InputProps={{readOnly:!!formData.country && !!countries.find(c=>c.name===formData.country)}} sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem', backgroundColor:formData.longitude?'action.hover':'transparent'}}}/>
                        </Box>

                        {/* Photo Upload */}
                        <Card sx={{borderRadius:'0.5rem', border:'2px dashed', borderColor:'neutral.slate200'}}>
                          <CardContent sx={{p:'1rem'}}>
                            <Box sx={{textAlign:'center', mb:'1rem'}}>
                              <PhotoCamera sx={{fontSize:'2rem', color:'text.secondary', mb:'0.5rem'}}/>
                              <Typography variant="h6" gutterBottom>Upload Photos ({formData.images.length}/10)</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{mb:'1rem'}}>Add up to 10 images (JPG, PNG, WebP)</Typography>
                              <input type="file" accept="image/*" multiple onChange={handleFileUpload} style={{display:'none'}} id="photo-upload"/>
                              <label htmlFor="photo-upload">
                                <Button variant="outlined" component="span" startIcon={<PhotoCamera/>} disabled={formData.images.length>=10}>Choose Files</Button>
                              </label>
                            </Box>

                            {/* Image previews */}
                            {formData.images.length>0 && (
                              <Box sx={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px,1fr))', gap:'0.5rem', mt:'1rem'}}>
                                {formData.images.map((file,index)=>(
                                  <Box key={index} sx={{position:'relative'}}>
                                    <Box sx={{width:'80px', height:'80px', borderRadius:'0.5rem', overflow:'hidden', border:'1px solid', borderColor:'neutral.slate200', backgroundImage:`url(${URL.createObjectURL(file)})`, backgroundSize:'cover', backgroundPosition:'center'}}/>
                                    <IconButton size="small" onClick={()=>handleRemoveImage(index)} sx={{position:'absolute', top:'-8px', right:'-8px', backgroundColor:'error.main', color:'white', width:'20px', height:'20px', '&:hover':{backgroundColor:'error.dark'}}}><Close fontSize="small"/></IconButton>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Action buttons */}
                  <Box sx={{display:'flex', gap:'1rem', justifyContent:'flex-end', mt:'2rem'}}>
                    <Button variant="outlined" size="large" onClick={()=>navigate('/my-auctions')} sx={{borderRadius:'0.5rem'}}>Cancel</Button>
                    <Button variant="contained" size="large" startIcon={<Edit/>} onClick={handleSaveAuction} sx={{borderRadius:'0.5rem'}}>{isEditMode?'Update Auction':'Create Auction'}</Button>
                  </Box>
                </>
              )}

              {/* Active Auctions Tab */}
              {!isEditMode && (
                <TabPanel value={tabValue} index={1}>
                  <Box sx={{height:'25rem', width:'100%'}}>
                    <DataGrid
                      rows={activeAuctions}
                      columns={activeAuctionsColumns}
                      paginationModel={{page:0, pageSize:10}}
                      pageSizeOptions={[5,10,25]}
                      checkboxSelection
                      disableRowSelectionOnClick
                      sx={{'& .MuiDataGrid-root':{border:'none'}, '& .MuiDataGrid-cell':{borderBottom:'1px solid #f0f0f0'}, '& .MuiDataGrid-columnHeaders':{backgroundColor:'neutral.slate50', borderBottom:'2px solid #e0e0e0'}}}
                    />
                  </Box>
                </TabPanel>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default AuctionCreate;
