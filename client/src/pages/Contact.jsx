import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Fade,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ContactSupport,
  Send,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Contact = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const subjectOptions = [
    'General Inquiry',
    'Technical Support',
    'Account Issues',
    'Complaint Follow-up',
    'Feature Request',
    'Bug Report',
    'Other',
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://complain-manege.onrender.com/api/submit_contact', {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        userId: user?.id || 'anonymous',
      });

      setSuccess(response.data.message);
      setFormData({
        name: user?.email?.split('@')[0] || '',
        email: user?.email || '',
        subject: '',
        message: '',
      });

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4, minHeight: '100vh', py: 4 }}>
      <Fade in timeout={800}>
        <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <ContactSupport sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Reach out to us with your query or concern.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />

                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={isAuthenticated}
                    
                  />

                  <FormControl fullWidth required>
                    <InputLabel>Subject </InputLabel>
                    <Select
                      value={formData.subject}
                      label="Subject"
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      
                    >
                      {subjectOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    placeholder="Please describe your inquiry or concern in detail..."
                    
                  />

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={<Send />}
                      disabled={loading}
                      sx={{ px: 4, py: 1.5 }}
                      
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/')}
                      
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Paper>
      </Fade>
    </Container>
  );
};

export default Contact;