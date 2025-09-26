import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  Button,
  IconButton,
  Badge,
  Avatar,
  Autocomplete,
  Alert,
  Tooltip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Inbox,
  Send,
  Delete,
  Reply,
  Add,
  Circle,
  Message,
  Gavel,
} from '@mui/icons-material';

interface MessageData {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  isUnread: boolean;
  auctionReference?: string;
  auctionId?: string;
}

interface Contact {
  username: string;
  type: 'winner' | 'seller';
  auctionTitle?: string;
  auctionId?: string;
  auctionStatus: 'ended';
}

// Mock data
const mockMessages: MessageData[] = [
  {
    id: '1',
    from: 'PhotoEnthusiast',
    to: 'You',
    subject: 'Re: Vintage Camera Collection - Payment Details',
    preview: 'Hi! I won the camera auction and would like to arrange payment and pickup...',
    content: 'Hi there!\n\nI won the vintage camera collection auction and I\'m very excited about this purchase. Could you please provide me with your preferred payment method? I can pay via PayPal, bank transfer, or cash if pickup is local.\n\nAlso, could we arrange a convenient time for pickup? I\'m available this weekend.\n\nThanks!\nPhotoEnthusiast',
    date: '2 hours ago',
    isUnread: true,
    auctionReference: 'Vintage Camera Collection - Rare 1960s Leica',
    auctionId: '1'
  },
  {
    id: '2',
    from: 'GamerPro',
    to: 'You',
    subject: 'Gaming Console Bundle - Shipping Question',
    preview: 'Congratulations on winning! Can you ship to my address in Texas?',
    content: 'Hello!\n\nI won your gaming console bundle auction. Congratulations on a great listing! The console looks exactly like what I was looking for.\n\nI was wondering if you could ship to Texas? I\'m happy to pay for shipping costs. Please let me know what shipping options you prefer and the estimated costs.\n\nLooking forward to hearing from you.\n\nBest regards,\nGamerPro',
    date: '5 hours ago',
    isUnread: false,
    auctionReference: 'Gaming Console Bundle with Games',
    auctionId: '2'
  },
  {
    id: '3',
    from: 'VintageHunter',
    to: 'You',
    subject: 'Question about Camera Lens Condition',
    preview: 'Hi, I\'m interested in bidding but have a question about the lens condition...',
    content: 'Hi,\n\nI\'m very interested in your camera lens auction. The photos look great, but I wanted to ask about a few details:\n\n1. Are there any scratches on the glass?\n2. Does the autofocus work smoothly?\n3. Do you have the original box and papers?\n\nI\'m a serious collector and this would be a great addition to my collection.\n\nThanks for your time!\nVintageHunter',
    date: '1 day ago',
    isUnread: false,
    auctionReference: 'Professional Camera Lens',
    auctionId: '3'
  },
];

const mockSentMessages: MessageData[] = [
  {
    id: '4',
    from: 'You',
    to: 'CameraCollector',
    subject: 'Re: Vintage Camera - Thank you!',
    preview: 'Thank you for the smooth transaction. The camera is exactly as described...',
    content: 'Hi CameraCollector,\n\nThank you for the quick payment and smooth transaction! I\'ve packaged the camera carefully and it will be shipped tomorrow morning via UPS with tracking.\n\nYou should receive a tracking number by email within 24 hours. The camera is in excellent condition as described, and I\'m sure you\'ll love it.\n\nBest regards!',
    date: '3 days ago',
    isUnread: false,
    auctionReference: 'Vintage Camera Collection',
    auctionId: '1'
  }
];

const mockContacts: Contact[] = [
  { username: 'PhotoEnthusiast', type: 'winner', auctionTitle: 'Vintage Camera Collection', auctionId: '1', auctionStatus: 'ended' },
  { username: 'GamerPro', type: 'winner', auctionTitle: 'Gaming Console Bundle', auctionId: '2', auctionStatus: 'ended' },
  { username: 'CameraCollector', type: 'winner', auctionTitle: 'Professional Camera', auctionId: '4', auctionStatus: 'ended' },
  { username: 'ArtDealer', type: 'seller', auctionTitle: 'Vintage Art Print', auctionId: '5', auctionStatus: 'ended' },
];

const Messages: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    content: ''
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageData | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const inboxMessages = mockMessages;
  const sentMessages = mockSentMessages;
  const currentMessages = tabValue === 0 ? inboxMessages : sentMessages;
  const unreadCount = inboxMessages.filter(m => m.isUnread).length;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedMessage(null);
  };

  const handleSelectMessage = (message: MessageData) => {
    setSelectedMessage(message);
    if (message.isUnread) message.isUnread = false;
  };

  const handleDeleteMessage = (message: MessageData) => {
    setMessageToDelete(message);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      setAlert({ type: 'success', message: 'Message deleted successfully.' });
      setShowDeleteDialog(false);
      setMessageToDelete(null);
      setSelectedMessage(null);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleCompose = () => {
    setShowCompose(true);
    setComposeData({ to: '', subject: '', content: '' });
  };

  const handleReply = () => {
    if (selectedMessage) {
      setComposeData({
        to: selectedMessage.from,
        subject: selectedMessage.subject.startsWith('Re: ')
          ? selectedMessage.subject
          : `Re: ${selectedMessage.subject}`,
        content: `\n\n--- Original Message ---\nFrom: ${selectedMessage.from}\nDate: ${selectedMessage.date}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.content}`
      });
      setShowCompose(true);
    }
  };

  const handleSendMessage = () => {
    if (!composeData.to || !composeData.subject || !composeData.content) {
      setAlert({ type: 'error', message: 'Please fill in all required fields.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    const selectedContact = mockContacts.find(c => c.username === composeData.to);
    if (!selectedContact || selectedContact.auctionStatus !== 'ended') {
      setAlert({ type: 'error', message: 'Messages can only be sent for ended auctions between winners and sellers.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    setAlert({ type: 'success', message: 'Message sent successfully!' });
    setShowCompose(false);
    setComposeData({ to: '', subject: '', content: '' });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <Container maxWidth={false}  sx={{ minWidth: '600px' }}  disableGutters>
      <Box sx={{ py: '2rem', px: '2rem' }}>
        {/* Header */}
        <Box sx={{ mb: '2rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '1rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Message sx={{ fontSize: '2rem', color: 'primary.main' }} />
              <Typography variant="h2" component="h1">Messages</Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={handleCompose} sx={{ borderRadius: '0.5rem' }}>
              Compose New
            </Button>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Communicate with auction winners and sellers
          </Typography>
        </Box>

        {/* Alert */}
        {alert && (
          <Alert severity={alert.type} sx={{ mb: '1rem' }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Paper sx={{ borderRadius: '1rem', overflow: 'hidden', minHeight: '70vh' }}>
          <Box sx={{ display: 'flex', height: '70vh' }}>
            {/* Left Panel - Message List */}
            <Box sx={{ width: '400px', borderRight: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                  <Tab icon={<Badge badgeContent={unreadCount} color="error"><Inbox /></Badge>} label="Inbox" />
                  <Tab icon={<Send />} label="Sent" />
                </Tabs>
              </Box>
              <List sx={{ p: 0, maxHeight: 'calc(70vh - 48px)', overflow: 'auto' }}>
                {currentMessages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItemButton
                      selected={selectedMessage?.id === message.id}
                      onClick={() => handleSelectMessage(message)}
                      sx={{
                        py: '1rem', px: '1rem',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': { backgroundColor: 'primary.light' }
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: '40px' }}>
                        <Avatar sx={{ width: '2rem', height: '2rem', backgroundColor: 'primary.main' }}>
                          {(tabValue === 0 ? message.from : message.to).charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {message.isUnread && <Circle sx={{ fontSize: '8px', color: 'primary.main' }} />}
                            <Typography
                              variant="body2"
                              fontWeight={message.isUnread ? 700 : 500}
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                            >
                              {tabValue === 0 ? message.from : message.to}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{message.date}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={message.isUnread ? 600 : 400}
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: '0.25rem' }}
                            >
                              {message.subject}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                            >
                              {message.preview}
                            </Typography>
                            {message.auctionReference && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem', mt: '0.25rem' }}>
                                <Gavel sx={{ fontSize: '0.75rem', color: 'primary.main' }} />
                                <Typography variant="caption" color="primary.main">{message.auctionReference}</Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteMessage(message); }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                    {index < currentMessages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>

            {/* Right Panel */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedMessage ? (
                <>
                  <Box sx={{ p: '1.5rem', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '0.5rem' }}>
                      <Typography variant="h6" fontWeight={600}>{selectedMessage.subject}</Typography>
                      <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                        <Tooltip title="Reply"><IconButton onClick={handleReply}><Reply /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton onClick={() => handleDeleteMessage(selectedMessage)}><Delete /></IconButton></Tooltip>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Avatar sx={{ width: '2rem', height: '2rem', backgroundColor: 'primary.main' }}>
                        {selectedMessage.from.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{selectedMessage.from}</Typography>
                        <Typography variant="caption" color="text.secondary">{selectedMessage.date}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, p: '1.5rem', overflow: 'auto' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {selectedMessage.content}
                    </Typography>
                  </Box>
                  <Box sx={{ p: '1.5rem', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button variant="contained" startIcon={<Reply />} onClick={handleReply} sx={{ borderRadius: '0.5rem' }}>
                      Reply
                    </Button>
                  </Box>
                </>
              ) : (
<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: '1.5rem', justifyContent: 'center' }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
    <Message sx={{ fontSize: '2rem', color: 'text.secondary' }} />
    <Typography variant="h6" color="text.secondary">No message selected</Typography>
  </Box>
  <Typography variant="body2" color="text.secondary">
    Select a message from the list to view its content.
  </Typography>
</Box>

              )}
            </Box>
          </Box>
        </Paper>

        {/* Compose Dialog */}
        <Dialog open={showCompose} onClose={() => setShowCompose(false)} fullScreen scroll="paper">
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Add color="primary" /> Compose New Message
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Autocomplete
                options={mockContacts}
                getOptionLabel={(option) => option.username}
                value={mockContacts.find(c => c.username === composeData.to) || null}
                onChange={(_, value) => setComposeData(prev => ({
                  ...prev,
                  to: value?.username || '',
                  subject: value?.auctionTitle ? `${value.auctionTitle} - Post-Auction Communication` : ''
                }))}
                renderInput={(params) => <TextField {...params} label="To" required />}
              />
              <TextField
                fullWidth
                label="Subject"
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={8}
                value={composeData.content}
                onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                required
                placeholder="Type your message here..."
                inputProps={{ maxLength: 2000 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.5rem',
                    minHeight: '200px',
                    alignItems: 'flex-start'
                  }
                }}
                helperText={`${composeData.content.length}/2000 characters`}
              />
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Note:</strong> Post-auction communication is only available between winners and sellers after the auction ends.
                </Typography>
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSendMessage} startIcon={<Send />}>Send Message</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this message?
            </Typography>
            {messageToDelete && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Subject:</Typography>
                  <Typography variant="body1">{messageToDelete.subject}</Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>From:</Typography>
                  <Typography variant="body1">{messageToDelete.from}</Typography>
                </CardContent>
              </Card>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Messages;
