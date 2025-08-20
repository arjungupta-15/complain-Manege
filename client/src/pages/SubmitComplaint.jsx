import React, { useState, useEffect } from 'react';
import {
  Container, Typography, TextField, MenuItem, Select,
  FormControl, InputLabel, Button, Box, Chip, IconButton,
  Alert, Paper
} from '@mui/material';
import {
  AttachFile, Clear, PriorityHigh, CheckCircle, Schedule
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SubmitComplaint = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    department: '',
    category: '',
    subCategory: '',
    subOther: '',
    description: '',
    priority: 'medium',
    file: null,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fileName, setFileName] = useState('');
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  // Fetch initial options (categories and departments) from backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        console.log('📡 Fetching initial options...');
        const response = await axios.get('http://localhost:5000/api/dynamic-options');
        console.log('✅ Initial options response:', response.data);
        
        const options = response.data;

        const categoryOptions = options.filter(opt => opt.type === 'category');
        const departmentOptions = options.filter(opt => opt.type === 'department');

        console.log('📋 Categories found:', categoryOptions.length);
        console.log('🏢 Departments found:', departmentOptions.length);

        setCategories(categoryOptions);
        setDepartments(departmentOptions);

      } catch (err) {
        console.error('❌ Error fetching options:', err);
        console.error('❌ Error details:', err.response?.data || err.message);
        
        // Fallback to hardcoded options if server is not available
        console.log('🔄 Using hardcoded options as fallback');
        setCategories(getHardcodedCategories());
        setDepartments(getHardcodedDepartments());
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // Auto-fill email from authenticated user
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  // Hardcoded categories as fallback
  const getHardcodedCategories = () => {
    return [
      { value: 'facility' },
      { value: 'request' },
      { value: 'hostel' }
    ];
  };

  // Hardcoded departments as fallback
  const getHardcodedDepartments = () => {
    return [
      { value: 'Computer Science' },
      { value: 'Electrical Engineering' },
      { value: 'Mechanical Engineering' },
      { value: 'Civil Engineering' },
      { value: 'Information Technology' }
    ];
  };

  // Fetch subcategories when category changes from backend
  useEffect(() => {
    console.log('🔍 Category changed to:', formData.category);
    if (formData.category) {
      const fetchSubCategories = async () => {
        setLoadingSubCategories(true);
        try {
          console.log('📡 Fetching subcategories for:', formData.category);
          // Convert to lowercase to match database
          const categoryLower = formData.category.toLowerCase();
          const url = `http://localhost:5000/api/dynamic-options?type=subCategory&parentCategory=${categoryLower}`;
          console.log('🌐 API URL:', url);
          
          const response = await axios.get(url);
          console.log('✅ Subcategories response:', response.data);
          setSubCategories(response.data);
        } catch (err) {
          console.error("❌ Failed to fetch subcategories:", err);
          console.error("❌ Error details:", err.response?.data || err.message);
          
          // Fallback to hardcoded subcategories if server is not available
          console.log('🔄 Using hardcoded subcategories as fallback');
          const hardcodedSubs = getHardcodedSubcategories(formData.category);
          setSubCategories(hardcodedSubs);
        } finally {
          setLoadingSubCategories(false);
        }
      };
      fetchSubCategories();
    } else {
      setSubCategories([]);
    }
  }, [formData.category]);

  // Hardcoded subcategories as fallback
  const getHardcodedSubcategories = (category) => {
    // Convert to lowercase for comparison
    const categoryLower = category.toLowerCase();
    
    switch (categoryLower) {
      case 'facility':
        return [
          { value: 'washroom' },
          { value: 'Water-Cooler' },
          { value: 'Garbage' },
          { value: 'tap' },
          { value: 'Fan' },
          { value: 'Lights' }
        ];
      case 'request':
        return [
          { value: 'wheelchair' },
          { value: 'mat' },
          { value: 'Table-Cloth' },
          { value: 'Sound-System' },
          { value: 'Seminar-Hall' }
        ];
      case 'hostel':
        return [
          { value: 'electricity' },
          { value: 'cleaning' },
          { value: 'water' }
        ];
      default:
        return [];
    }
  };

  const autoSetPriority = (category, sub) => {
    if (category === 'facility') {
      if (['washroom', 'Water-Cooler', 'Garbage'].includes(sub)) return 'high';
      if (['tap', 'Fan'].includes(sub)) return 'medium';
      if (sub === 'Lights') return 'low';
    } else if (category === 'request') {
      if (sub === 'wheelchair') return 'urgent';
      if (['mat', 'Table-Cloth'].includes(sub)) return 'low';
      if (['Sound-System', 'Seminar-Hall'].includes(sub)) return 'medium';
    } else if (category === 'hostel') {
      if (sub === 'electricity') return 'urgent';
      if (['cleaning', 'water'].includes(sub)) return 'high';
    }
    return 'medium';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <PriorityHigh />;
      case 'high': return <PriorityHigh />;
      case 'medium': return <Schedule />;
      case 'low': return <CheckCircle />;
      default: return <Schedule />;
    }
  };

  useEffect(() => {
    const { category, subCategory } = formData;
    if (category && subCategory) {
      setFormData(prev => ({
        ...prev,
        priority: autoSetPriority(category, subCategory)
      }));
    }
  }, [formData.category, formData.subCategory]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'category' ? { subCategory: '', subOther: '' } : {}),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, file }));
      setFileName(file.name);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setFileName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { email, department, category, subCategory, subOther, description } = formData;
    if (!email || !department || !category || !subCategory || !description) {
      setError('Please fill all required fields');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('email', email);
    formDataToSend.append('department', department);
    formDataToSend.append('category', category);
    formDataToSend.append('subCategory', subCategory);
    formDataToSend.append('subOther', formData.subOther);
    formDataToSend.append('description', description);
    formDataToSend.append('priority', formData.priority);
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }

    try {
              const response = await axios.post('http://localhost:5000/api/complaint/submit_complaint', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(response.data.message);
      setFormData({
        email: user?.email || '',
        department: '',
        category: '',
        subCategory: '',
        subOther: '',
        description: '',
        priority: 'medium',
        file: null,
      });
      setFileName('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit complaint. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(to right, #0c2d59, #0d47a1)',
        minHeight: '100vh',
        py: 6,
        px: 2,
        overflow: 'auto',
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4, backgroundColor: '#fff' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#0c2d59' }}>
            Submit a Complaint
          </Typography>

          <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.secondary' }}>
            Please fill the form carefully. Our team will address your concern soon.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Your Email Address"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              InputProps={{ readOnly: true }}
              helperText={formData.email ? 'Fetched from your login' : ''}
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                label="Department"
                required
                disabled={loadingOptions}
              >
                {departments.map(dep => (
                  <MenuItem key={dep.value} value={dep.value}>{dep.value}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                label="Category"
                required
                disabled={loadingOptions}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>{cat.value}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.category && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>
                  {loadingSubCategories ? 'Loading...' : `${formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Type`}
                </InputLabel>
                <Select
                  value={formData.subCategory}
                  onChange={(e) => handleChange('subCategory', e.target.value)}
                  label={loadingSubCategories ? 'Loading...' : `${formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Type`}
                  required
                  disabled={loadingSubCategories}
                >
                  {subCategories.length === 0 ? (
                    <MenuItem disabled>No options available</MenuItem>
                  ) : (
                    subCategories.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.value}</MenuItem>
                    ))
                  )}
                </Select>
                {subCategories.length === 0 && !loadingSubCategories && formData.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    No subcategories found for {formData.category}. Please contact admin.
                  </Typography>
                )}
              </FormControl>
            )}

            {formData.subCategory === 'other' && (
              <TextField
                fullWidth
                label={`Specify Other ${formData.category} Type`}
                value={formData.subOther}
                onChange={(e) => handleChange('subOther', e.target.value)}
                sx={{ mb: 3 }}
              />
            )}

            {formData.priority && (
              <Box sx={{ mb: 3 }}>
                <Chip
                  icon={getPriorityIcon(formData.priority)}
                  label={`Priority: ${formData.priority.toUpperCase()}`}
                  color={getPriorityColor(formData.priority)}
                  variant="filled"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 0.5,
                    borderRadius: '20px',
                    backgroundColor:
                      formData.priority === 'urgent' ? '#d32f2f' :
                      formData.priority === 'high' ? '#f44336' :
                      formData.priority === 'medium' ? '#ff9800' :
                      '#66bb6a',
                    color: '#fff',
                  }}
                />
              </Box>
            )}

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              sx={{ mb: 3 }}
            />

            <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 2, mb: 3 }}>
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload">
                <Button variant="outlined" component="span" startIcon={<AttachFile />}>
                  Attach File (Optional)
                </Button>
              </label>
              {fileName && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">{fileName}</Typography>
                  <IconButton size="small" onClick={handleRemoveFile}>
                    <Clear />
                  </IconButton>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5MB)
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                backgroundColor: '#0c2d59',
                '&:hover': {
                  backgroundColor: '#08306b',
                },
              }}
            >
              Submit Complaint
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default SubmitComplaint;