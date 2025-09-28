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
  CircularProgress,
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
import { itemsApi, categoriesApi, bidsApi } from '../api';
import type { Item, Category, ItemCreate, ItemUpdate, BidSummary } from '../api/types';
import { getErrorMessage } from '../utils/errorHandling';

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
  categories: number[];
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
  id: number;
  itemName: string;
  currentPrice: number;
  bidCount: number;
  timeRemaining: string;
  status: 'active' | 'ending_soon';
}


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


const AuctionCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [tabValue, setTabValue] = useState(0);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeAuctions, setActiveAuctions] = useState<ActiveAuction[]>([]);
  const [auctionBids, setAuctionBids] = useState<{ [key: number]: BidSummary[] }>({});
  const [existingImages, setExistingImages] = useState<string[]>([]);

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

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [categoriesData, myItems] = await Promise.all([
          categoriesApi.getAllCategories(),
          itemsApi.getMyItems(0, 100)
        ]);

        setCategories(categoriesData);

        // Transform items to active auctions format
        const activeItems = myItems.filter(item => item.status === 'active').map(item => ({
          id: item.id,
          itemName: item.name,
          currentPrice: item.currently,
          bidCount: item.number_of_bids,
          timeRemaining: formatTimeRemaining(item.ends),
          status: (new Date(item.ends).getTime() - Date.now() < 2 * 60 * 60 * 1000) ? 'ending_soon' : 'active' as 'active' | 'ending_soon'
        }));
        setActiveAuctions(activeItems);

        // If editing, fetch the specific item
        if (isEditMode && id) {
          const itemData = await itemsApi.getItem(parseInt(id));
          setFormData({
            name: itemData.name,
            categories: itemData.categories.map(cat => cat.id),
            firstBid: itemData.first_bid.toString(),
            buyPrice: itemData.buy_price?.toString() || '',
            startDate: itemData.started ? new Date(itemData.started) : new Date(),
            endDate: new Date(itemData.ends),
            description: itemData.description || '',
            location: itemData.location || '',
            country: itemData.country || '',
            latitude: itemData.latitude?.toString() || '',
            longitude: itemData.longitude?.toString() || '',
            images: [], // File objects can't be restored from API
          });
          // Set existing images separately
          setExistingImages(itemData.images || []);
        }
      } catch (error: any) {
        console.error('Failed to fetch initial data:', error);
        setAlert({ type: 'error', message: 'Failed to load data. Please refresh the page.' });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
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
      const remainingSlots = 10 - existingImages.length;
      const allowedNewImages = [...formData.images, ...newImages].slice(0, remainingSlots);
      setFormData(prev => ({ ...prev, images: allowedNewImages }));
    }
  };

  const handleRemoveImage = (index: number) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const handleRemoveExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));

  const getImageUrl = (imagePath: string): string => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath; // Already absolute URL
    return `${API_BASE_URL}${imagePath}`;
  };

  const totalImages = existingImages.length + formData.images.length;

  const handleSaveAuction = async () => {
    const requiredFields: (keyof AuctionFormData)[] = ['name','categories','firstBid','startDate','endDate','description','location','country'];
    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      if (field === 'categories') return (value as number[]).length === 0;
      return !value;
    });

    if (missingFields.length > 0) {
      setAlert({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      setAlert({ type: 'error', message: 'End date must be after start date.' });
      return;
    }

    if (formData.buyPrice && parseFloat(formData.buyPrice) <= parseFloat(formData.firstBid)) {
      setAlert({ type: 'error', message: 'Buy Now price must be higher than First Bid.' });
      return;
    }

    if (!isEditMode && totalImages === 0) {
      setAlert({ type: 'error', message: 'Please upload at least one photo.' });
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && id) {
        // Update existing auction
        let newImageUrls: string[] = [];
        if (formData.images.length > 0) {
          try {
            const uploadResponse = await itemsApi.uploadImages(formData.images);
            newImageUrls = uploadResponse.image_urls;
          } catch (uploadError: any) {
            console.error('Upload error details:', uploadError);
            throw new Error(`Image upload failed: ${uploadError.response?.data?.detail || uploadError.message}`);
          }
        }

        // Combine existing images (not removed) with newly uploaded images
        const allImages = [...existingImages, ...newImageUrls];

        const updateData: ItemUpdate = {
          name: formData.name,
          description: formData.description,
          first_bid: parseFloat(formData.firstBid),
          buy_price: formData.buyPrice ? parseFloat(formData.buyPrice) : undefined,
          location: formData.location,
          country: formData.country,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          started: formData.startDate!.toISOString(),
          ends: formData.endDate!.toISOString(),
          category_ids: formData.categories,
          images: allImages
        };

        await itemsApi.updateItem(parseInt(id), updateData);
        setAlert({ type: 'success', message: 'Auction updated successfully!' });
        setTimeout(() => navigate('/my-auctions'), 1500);
      } else {
        // Create new auction with files
        const createData: ItemCreate = {
          name: formData.name,
          description: formData.description,
          first_bid: parseFloat(formData.firstBid),
          buy_price: formData.buyPrice ? parseFloat(formData.buyPrice) : undefined,
          location: formData.location,
          country: formData.country,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          started: formData.startDate!.toISOString(),
          ends: formData.endDate!.toISOString(),
          category_ids: formData.categories,
        };

        const newItem = await itemsApi.createItem(createData, formData.images);
        setAlert({ type: 'success', message: 'Auction created successfully!' });

        // Clear form
        setFormData({
          name: '', categories: [], firstBid: '', buyPrice: '',
          startDate: new Date(Date.now() + 24*60*60*1000), endDate: new Date(Date.now()+7*24*60*60*1000),
          description: '', location:'', country:'', latitude:'', longitude:'', images:[]
        });
        setExistingImages([]);
      }
    } catch (error: any) {
      console.error('Save auction error:', error);
      const errorMessage = getErrorMessage(error);
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }

    setTimeout(() => setAlert(null), 3000);
  };

  const handleViewBids = async (auctionId: number) => {
    try {
      const bids = await bidsApi.getItemBids(auctionId);
      setAuctionBids(prev => ({ ...prev, [auctionId]: bids }));
      console.log('Bids for auction:', auctionId, bids);
    } catch (error: any) {
      console.error('Failed to fetch bids:', error);
      setAlert({ type: 'error', message: 'Failed to load bids.' });
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
      <GridActionsCellItem key="view" icon={<Tooltip title="View Bids"><Visibility/></Tooltip>} label="View Bids" onClick={()=>handleViewBids(params.id as number)}/>
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
                  {/* <Tab icon={<Gavel/>} label="Active Auctions" id="auction-tab-1" aria-controls="auction-tabpanel-1" iconPosition="start"/> */}
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
                          value={categories.filter(cat => formData.categories.includes(cat.id))}
                          onChange={(_, newValue) => handleInputChange('categories', newValue.map(cat => cat.id))}
                          getOptionLabel={(option) => option.name}
                          size="medium"
                          limitTags={3}
                          renderTags={(value, getTagProps)=>value.map((option,index)=>(
                            <Chip variant="outlined" label={option.name} size="small" {...getTagProps({index})}/>
                          ))}
                          renderInput={(params)=>(
                            <TextField {...params} label="Categories" placeholder="Select categories..." required sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem', minHeight:'56px', maxHeight:'none', '& .MuiAutocomplete-inputRoot':{flexWrap:'wrap', maxHeight:'120px', overflowY:'auto'}}}}/>
                          )}
                          sx={{'& .MuiAutocomplete-inputRoot':{flexWrap:'wrap'}}}
                          loading={categories.length === 0}
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
                          renderInput={(params) => <TextField {...params} fullWidth required sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}} />}
                        />
                        {/* End Date */}
                        <DateTimePicker
                          label="End Date/Time"
                          value={formData.endDate}
                          onChange={(newValue)=>handleInputChange('endDate', newValue)}
                          minDateTime={formData.startDate?new Date(formData.startDate.getTime()+60*60*1000):new Date(Date.now()+65*60*1000)}
                          renderInput={(params) => <TextField {...params} fullWidth required sx={{'& .MuiOutlinedInput-root':{borderRadius:'0.5rem'}}} />}
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
                              <Typography variant="h6" gutterBottom>Upload Photos ({totalImages}/10)</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{mb:'1rem'}}>Add up to 10 images (JPG, PNG, WebP)</Typography>
                              <input type="file" accept="image/*" multiple onChange={handleFileUpload} style={{display:'none'}} id="photo-upload"/>
                              <label htmlFor="photo-upload">
                                <Button variant="outlined" component="span" startIcon={<PhotoCamera/>} disabled={totalImages>=10}>Choose Files</Button>
                              </label>
                            </Box>

                            {/* Image previews */}
                            {(existingImages.length > 0 || formData.images.length > 0) && (
                              <Box sx={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px,1fr))', gap:'0.5rem', mt:'1rem'}}>
                                {/* Existing images */}
                                {existingImages.map((imagePath, index) => (
                                  <Box key={`existing-${index}`} sx={{position:'relative'}}>
                                    <Box sx={{width:'80px', height:'80px', borderRadius:'0.5rem', overflow:'hidden', border:'1px solid', borderColor:'neutral.slate200', backgroundImage:`url(${getImageUrl(imagePath)})`, backgroundSize:'cover', backgroundPosition:'center'}}/>
                                    <IconButton size="small" onClick={()=>handleRemoveExistingImage(index)} sx={{position:'absolute', top:'-8px', right:'-8px', backgroundColor:'error.main', color:'white', width:'20px', height:'20px', '&:hover':{backgroundColor:'error.dark'}}}><Close fontSize="small"/></IconButton>
                                  </Box>
                                ))}
                                {/* New uploaded files */}
                                {formData.images.map((file,index)=>(
                                  <Box key={`new-${index}`} sx={{position:'relative'}}>
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
                    <Button variant="outlined" size="large" onClick={()=>navigate('/my-auctions')} disabled={loading} sx={{borderRadius:'0.5rem'}}>Cancel</Button>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Edit/>}
                      onClick={handleSaveAuction}
                      disabled={loading}
                      sx={{borderRadius:'0.5rem'}}
                    >
                      {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Auction' : 'Create Auction')}
                    </Button>
                  </Box>
                </>
              )}

            </Box>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default AuctionCreate;
