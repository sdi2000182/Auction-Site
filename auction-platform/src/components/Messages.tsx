import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Badge,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Chip
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
  Search,
  Filter,
  MoreVert,
  Refresh,
  CheckBox,
  Star,
  StarBorder,
  Archive,
  Close,
  Attachment,
  EmojiEmotions,
  ArrowBack
} from '@mui/icons-material';
import { messagesApi } from '../api';
import type { MessageSummary, Message as ApiMessage, MessageCreate } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { Textarea } from './ui/Textarea';

interface MessageData {
  id: number;
  from: string;
  to: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  isUnread: boolean;
  isStarred?: boolean;
  auctionReference?: string;
  auctionId?: number;
  sender_id: number;
  receiver_id: number;
}

interface ComposeData {
  to: string;
  receiverId: string;
  subject: string;
  content: string;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [inboxMessages, setInboxMessages] = useState<MessageData[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageData[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [composeData, setComposeData] = useState<ComposeData>({ to: '', receiverId: '', subject: '', content: '' });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentMessages = tabValue === 0 ? inboxMessages : sentMessages;

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return currentMessages;

    return currentMessages.filter(message =>
      message.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentMessages, searchQuery]);

  // Transform API message to UI format
  const transformMessageToUI = (message: ApiMessage, folder: 'inbox' | 'sent'): MessageData => {
    return {
      id: message.id,
      from: folder === 'inbox' ? (message.sender_username || 'Unknown') : user?.username || 'You',
      to: folder === 'sent' ? (message.receiver_username || 'Unknown') : user?.username || 'You',
      subject: message.subject,
      preview: message.content ? message.content.substring(0, 100) + '...' : '',
      content: message.content || '',
      date: new Date(message.created_at).toLocaleString(),
      isUnread: folder === 'inbox' ? !message.is_read : false,
      isStarred: false,
      auctionReference: message.item?.name || message.item_name,
      auctionId: message.item?.id || message.item_id,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id
    };
  };

  // Load messages on component mount
  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        console.log('Loading messages for user:', user);

        // Load inbox, sent, and unread count in parallel
        const [inboxData, sentData, unreadData] = await Promise.all([
          messagesApi.getMessages('inbox'),
          messagesApi.getMessages('sent'),
          messagesApi.getUnreadCount()
        ]);

        console.log('Messages API responses:', {
          inbox: inboxData,
          sent: sentData,
          unread: unreadData
        });

        // Debug: Log read status of messages
        console.log('Inbox messages read status:', inboxData.map(msg => ({
          id: msg.id,
          subject: msg.subject,
          is_read: msg.is_read
        })));

        // Transform inbox messages
        const transformedInbox = await Promise.all(
          inboxData.map(async (msg: MessageSummary) => {
            try {
              const fullMessage = await messagesApi.getMessage(msg.id);
              return transformMessageToUI(fullMessage, 'inbox');
            } catch (err) {
              // If we can't get full message, use summary data
              return {
                id: msg.id,
                from: msg.sender_username || msg.sender?.username || 'Unknown',
                to: user.username,
                subject: msg.subject,
                preview: msg.content ? msg.content.substring(0, 100) + '...' : '',
                content: msg.content || '',
                date: new Date(msg.created_at).toLocaleString(),
                isUnread: !msg.is_read,
                auctionReference: msg.item?.name,
                auctionId: msg.item?.id,
                sender_id: 0, // Default fallback value
                receiver_id: user.id || 0
              };
            }
          })
        );

        // Transform sent messages
        const transformedSent = await Promise.all(
          sentData.map(async (msg: MessageSummary) => {
            try {
              const fullMessage = await messagesApi.getMessage(msg.id);
              return transformMessageToUI(fullMessage, 'sent');
            } catch (err) {
              return {
                id: msg.id,
                from: user.username,
                to: msg.receiver_username || msg.receiver?.username || 'Unknown',
                subject: msg.subject,
                preview: msg.content ? msg.content.substring(0, 100) + '...' : '',
                content: msg.content || '',
                date: new Date(msg.created_at).toLocaleString(),
                isUnread: false,
                auctionReference: msg.item?.name,
                auctionId: msg.item?.id,
                sender_id: user.id || 0,
                receiver_id: 0 // Default fallback value
              };
            }
          })
        );

        setInboxMessages(transformedInbox);
        setSentMessages(transformedSent);
        setUnreadCount(unreadData.unread_count);
      } catch (err: any) {
        console.error('Failed to load messages:', err);
        setAlert({ type: 'error', message: 'Failed to load messages' });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [user]);

  const handleSendMessage = async () => {
    if (!composeData.receiverId || !composeData.subject || !composeData.content) {
      setAlert({ type: 'error', message: 'Please fill in all required fields.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      setSendingMessage(true);

      // Create message data for API
      const messageData: MessageCreate = {
        receiver_id: parseInt(composeData.receiverId),
        subject: composeData.subject,
        content: composeData.content,
      };

      console.log('Sending message:', messageData);
      const sentMessage = await messagesApi.sendMessage(messageData);
      console.log('Message sent successfully:', sentMessage);

      // Add to sent messages list
      const newMessage = transformMessageToUI(sentMessage, 'sent');
      setSentMessages(prev => [newMessage, ...prev]);

      setAlert({ type: 'success', message: 'Message sent successfully!' });
      setShowCompose(false);
      setComposeData({ to: '', receiverId: '', subject: '', content: '' });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setAlert({ type: 'error', message: err.message || 'Failed to send message.' });
    } finally {
      setSendingMessage(false);
    }

    setTimeout(() => setAlert(null), 5000);
  };

  const handleDeleteMessage = (messageId: number) => {
    setMessageToDelete(messageId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      await messagesApi.deleteMessage(messageToDelete);

      // Remove from local state
      setInboxMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
      setSentMessages(prev => prev.filter(msg => msg.id !== messageToDelete));

      setAlert({ type: 'success', message: 'Message deleted successfully!' });
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Failed to delete message' });
    }

    setShowDeleteDialog(false);
    setMessageToDelete(null);
    setTimeout(() => setAlert(null), 3000);
  };

  const handleMarkAllAsRead = async () => {
    const unreadMessages = inboxMessages.filter(msg => msg.isUnread);
    if (unreadMessages.length === 0) return;

    try {
      await messagesApi.markMessagesAsRead({
        message_ids: unreadMessages.map(msg => msg.id)
      });

      // Update local state
      setInboxMessages(prev => prev.map(msg => ({ ...msg, isUnread: false })));
      setUnreadCount(0);

      setAlert({ type: 'success', message: 'All messages marked as read!' });
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
      setAlert({ type: 'error', message: 'Failed to mark messages as read' });
    }

    setTimeout(() => setAlert(null), 3000);
  };

  const getFolderTitle = () => {
    return tabValue === 0 ? 'Inbox' : 'Sent';
  };

  const handleMessageClick = async (message: MessageData) => {
    setSelectedMessage(message);
    setShowMessageDetail(true);

    // Mark as read if it's unread
    if (message.isUnread && tabValue === 0) {
      try {
        // Call API to mark message as read
        await messagesApi.markMessagesAsRead({
          message_ids: [message.id]
        });

        // Update local state
        setInboxMessages(prev =>
          prev.map(msg =>
            msg.id === message.id ? { ...msg, isUnread: false } : msg
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err: any) {
        console.error('Failed to mark message as read:', err);
        // Still update local state even if API call fails
        setInboxMessages(prev =>
          prev.map(msg =>
            msg.id === message.id ? { ...msg, isUnread: false } : msg
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleBackToList = () => {
    setShowMessageDetail(false);
    setSelectedMessage(null);
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    
    // Determine who to reply to based on current view (inbox vs sent)
    const replyToId = tabValue === 0 ? selectedMessage.sender_id : selectedMessage.receiver_id;
    const replyToUsername = tabValue === 0 ? selectedMessage.from : selectedMessage.to;
    
    // Pre-fill compose form with reply data
    setComposeData({
      to: replyToUsername,
      receiverId: replyToId.toString(),
      subject: selectedMessage.subject.startsWith('Re: ') 
        ? selectedMessage.subject 
        : `Re: ${selectedMessage.subject}`,
      content: `\n\n--- Original Message ---\nFrom: ${selectedMessage.from}\nDate: ${selectedMessage.date}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.content}`,
    });
    
    setShowCompose(true);
    setShowMessageDetail(false);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: '2rem' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: '2rem' }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '1rem',
          overflow: 'hidden',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <Box sx={{
          p: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(20px)',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}>
                <Inbox sx={{ fontSize: '1.5rem', color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {getFolderTitle()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredMessages.length} messages
                  {unreadCount > 0 && `, ${unreadCount} unread`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
              <IconButton size="small" sx={{ '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
                <Refresh />
              </IconButton>
              <IconButton size="small" sx={{ '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
                <MoreVert />
              </IconButton>
              {/* <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCompose(true)}
                sx={{
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Compose
              </Button> */}
            </Box>
          </Box>

          {/* Search and Actions */}
          <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', flex: 1 }}>
              <TextField
                fullWidth
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      border: '1px solid rgba(255,255,255,0.3)',
                    },
                    '&.Mui-focused': {
                      border: '1px solid #667eea',
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
 
              <IconButton size="small" sx={{ '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
                <Filter />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                Inbox
                {unreadCount > 0 && (
                  <Badge badgeContent={unreadCount} color="primary" />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                Sent
                {/* {sentMessages.length > 0 && (
                  <Badge badgeContent={sentMessages.length} color="primary" />
                )} */}
              </Box>
            }
          />
        </Tabs>

        {/* Messages List or Detail View */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {showMessageDetail && selectedMessage ? (
            // Message Detail View
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Detail Header */}
              <Box sx={{
                p: '1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <IconButton
                  onClick={handleBackToList}
                  sx={{ '&:hover': { background: 'rgba(255,255,255,0.1)' } }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h6" fontWeight={600}>
                  {selectedMessage.subject}
                </Typography>
                {selectedMessage.isUnread && (
                  <Chip label="New" size="small" color="primary" />
                )}
              </Box>

              {/* Message Content */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: '2rem' }}>
                <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
                  {/* Sender Info */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', mb: '2rem' }}>
                    <Avatar sx={{
                      width: '3rem',
                      height: '3rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}>
                      {selectedMessage.from.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '0.5rem' }}>
                        <Typography variant="h6" fontWeight={600}>
                          {selectedMessage.from}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedMessage.date}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: '1rem' }}>
                        To: {selectedMessage.to}
                      </Typography>

                      {/* Message Body */}
                      <Box sx={{
                        p: '1.5rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}>
                        <Typography variant="body1" sx={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          color: 'text.primary'
                        }}>
                          {selectedMessage.content}
                        </Typography>
                      </Box>

                      {/* Auction Reference */}
                      {selectedMessage.auctionReference && (
                        <Box sx={{
                          mt: '1rem',
                          p: '1rem',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Gavel sx={{ fontSize: '1rem', color: '#667eea' }} />
                          <Typography variant="body2" color="#667eea" fontWeight={600}>
                            Auction: {selectedMessage.auctionReference}
                          </Typography>
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: '1rem', mt: '2rem' }}>
                        <Button
                          variant="contained"
                          startIcon={<Reply />}
                          onClick={handleReply}
                          sx={{
                            borderRadius: '0.75rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          Reply
                        </Button>
                        {/* <Button
                          variant="outlined"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                          sx={{
                            borderRadius: '0.75rem',
                            borderColor: 'rgba(255,255,255,0.3)',
                            color: 'text.primary',
                            '&:hover': {
                              borderColor: '#f44336',
                              background: 'rgba(244, 67, 54, 0.1)',
                              color: '#f44336',
                            },
                          }}
                        >
                          Delete
                        </Button> */}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            // Messages List
            <>
          {filteredMessages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                p: '3rem',
              }}
            >
              <Box sx={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: '1rem',
              }}>
                <Archive sx={{ fontSize: '2rem', color: 'text.disabled' }} />
              </Box>
              <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
                {searchQuery ? 'No messages found' : tabValue === 0 ? 'No messages in your inbox' : 'No sent messages'}
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: '2rem', maxWidth: '400px' }}>
                {searchQuery
                  ? 'Try adjusting your search terms to find what you\'re looking for.'
                  : tabValue === 0
                    ? 'When you receive messages, they will appear here. Start by sending your first message!'
                    : 'Messages you send will appear here.'
                }
              </Typography>
              {tabValue === 0 && !searchQuery && (
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setShowCompose(true)}
                  sx={{
                    borderRadius: '0.75rem',
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a6fd8',
                      background: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  Send your first message
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              {filteredMessages.map((message, index) => (
                <Box
                  key={message.id}
                  sx={{
                    p: '1rem',
                    borderBottom: index < filteredMessages.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    background: message.isUnread
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)'
                      : 'transparent',
                    borderLeft: message.isUnread ? '4px solid #667eea' : '4px solid transparent',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => handleMessageClick(message)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <Avatar sx={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: message.isUnread
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                    }}>
                      {(tabValue === 0 ? message.from : message.to).split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Avatar>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '0.25rem' }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={message.isUnread ? 700 : 500}
                          sx={{
                            color: message.isUnread ? 'text.primary' : 'text.secondary',
                            maxWidth: '60%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tabValue === 0 ? message.from : message.to}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {message.isUnread && (
                            <Box sx={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#667eea',
                              boxShadow: '0 0 8px rgba(102, 126, 234, 0.5)',
                            }} />
                          )}
                          <Typography
                            variant="caption"
                            color={message.isUnread ? 'primary.main' : 'text.disabled'}
                            fontWeight={message.isUnread ? 600 : 400}
                          >
                            {message.date}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        variant="body2"
                        fontWeight={message.isUnread ? 600 : 500}
                        sx={{
                          mb: '0.25rem',
                          color: message.isUnread ? 'text.primary' : 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {message.subject}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.disabled"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mb: message.auctionReference ? '0.5rem' : 0,
                        }}
                      >
                        {message.preview}
                      </Typography>

                      {message.auctionReference && (
                        <Box sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          px: '0.5rem',
                          py: '0.25rem',
                          borderRadius: '0.5rem',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                        }}>
                          <Gavel sx={{ fontSize: '0.875rem', color: '#667eea' }} />
                          <Typography variant="caption" color="#667eea" fontWeight={600}>
                            Re: {message.auctionReference}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Action buttons - show on hover */}
                    <Box sx={{
                      display: 'flex',
                      gap: '0.25rem',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      '.MuiBox-root:hover &': {
                        opacity: 1,
                      },
                    }}>
                      <IconButton
                        size="small"
                        sx={{
                          '&:hover': {
                            background: 'rgba(255, 193, 7, 0.1)',
                            color: '#ffc107',
                          }
                        }}
                      >
                        <StarBorder sx={{ fontSize: '1rem' }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          '&:hover': {
                            background: 'rgba(33, 150, 243, 0.1)',
                            color: '#2196f3',
                          }
                        }}
                      >
                        <Archive sx={{ fontSize: '1rem' }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(message.id);
                        }}
                        sx={{
                          '&:hover': {
                            background: 'rgba(244, 67, 54, 0.1)',
                            color: '#f44336',
                          }
                        }}
                      >
                        <Delete sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
            </>
          )}
        </Box>

        {/* Alert */}
        {alert && (
          <Alert
            severity={alert.type}
            sx={{
              m: '1rem',
              borderRadius: '0.75rem',
              background: alert.type === 'success'
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(211, 47, 47, 0.1) 100%)',
              border: `1px solid ${alert.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`,
            }}
          >
            {alert.message}
          </Alert>
        )}
      </Paper>

      {/* Compose Dialog */}
      <Dialog
        open={showCompose}
        onClose={() => setShowCompose(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: '1rem',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}>
              <Add sx={{ fontSize: '1rem', color: 'white' }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              New Message
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              setShowCompose(false);
              setComposeData({ to: '', receiverId: '', subject: '', content: '' });
            }}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TextField
              fullWidth
              label="To (Username)"
              value={composeData.to}
              onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="Enter recipient's username"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0.75rem',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Recipient User ID"
              type="number"
              value={composeData.receiverId}
              onChange={(e) => setComposeData(prev => ({ ...prev, receiverId: e.target.value }))}
              placeholder="Enter recipient's user ID"
              helperText="You can find the user ID in their profile or from auction details"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0.75rem',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Subject"
              value={composeData.subject}
              onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter message subject"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0.75rem',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
              }}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: '0.5rem' }}>
                Message
              </Typography>
              <Textarea
                value={composeData.content}
                onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your message here..."
                rows={6}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  color: '#333',
                  outline: 'none',
                  resize: 'vertical',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                  boxSizing: 'border-box',
                }}
              />
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ p: '1.5rem', pt: '1rem', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <IconButton size="small" sx={{ '&:hover': { background: 'rgba(102, 126, 234, 0.1)' } }}>
              <Attachment />
            </IconButton>
            <IconButton size="small" sx={{ '&:hover': { background: 'rgba(102, 126, 234, 0.1)' } }}>
              <EmojiEmotions />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              onClick={() => {
                setShowCompose(false);
                setComposeData({ to: '', receiverId: '', subject: '', content: '' });
              }}
              disabled={sendingMessage}
              sx={{ borderRadius: '0.75rem' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={sendingMessage || !composeData.receiverId || !composeData.subject || !composeData.content}
              startIcon={sendingMessage ? <CircularProgress size={16} color="inherit" /> : <Send />}
              sx={{
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                },
                '&:disabled': {
                  background: 'rgba(0,0,0,0.12)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Message?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this message? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: '1.5rem', pt: '1rem' }}>
          <Button
            onClick={() => setShowDeleteDialog(false)}
            sx={{ borderRadius: '0.75rem' }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            sx={{
              borderRadius: '0.75rem',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Messages;