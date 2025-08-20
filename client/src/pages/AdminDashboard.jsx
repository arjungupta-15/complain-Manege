import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Tabs, Tab, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Divider
} from '@mui/material';
import {
  Dashboard, BugReport, CheckCircle, Pending, Refresh,
  Edit, Delete, PriorityHigh, Schedule, TrendingUp,
  BarChart, PieChart, ShowChart, Analytics, Save, Close
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import axios from 'axios';

// Helper Card for consistent chart layout and alignment
const ChartCard = ({ icon, title, children }) => (
  <Paper 
    elevation={3} 
    sx={{ 
      p: 3, 
      height: 450, 
      borderRadius: 3,
      display: 'flex',
      flexDirection: 'column',
      background: 'white'
    }}
  >
    <Box display="flex" alignItems="center" mb={2}>
      {icon}
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', ml: 2 }}>
        {title}
      </Typography>
    </Box>
    <Divider sx={{ mb: 2 }} />
    <Box sx={{ flex: 1, minHeight: 0 }}>
      {children}
    </Box>
  </Paper>
);

// Reusable section wrapper for settings lists
const SectionCard = ({ icon, title, children, actions }) => (
  <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
      <Box display="flex" alignItems="center">
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', ml: 1.5 }}>
          {title}
        </Typography>
      </Box>
      {actions}
    </Box>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Dynamic options states
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [newOption, setNewOption] = useState({ type: 'category', value: '', parentCategory: '', code: '' });
  // Inline edit state for department code
  const [inlineEditDeptId, setInlineEditDeptId] = useState(null);
  const [inlineEditCode, setInlineEditCode] = useState('');

  // Dialog states
  const [addOptionDialog, setAddOptionDialog] = useState(false);
  const [editOptionDialog, setEditOptionDialog] = useState(false);
  const [editingOption, setEditingOption] = useState(null);

  useEffect(() => {
    fetchComplaints();
    fetchDynamicOptions();
  }, []);

  // Expose a global handler for sidebar to control tabs and filters
  useEffect(() => {
    const setTabByKey = (key) => {
      switch (key) {
        case 'dashboard':
          setActiveTab(0);
          break;
        case 'all-complaints':
          setActiveTab(1);
          setFilterStatus('all');
          break;
        case 'resolved-complaints':
          setActiveTab(1);
          setFilterStatus('resolved');
          break;
        case 'pending-complaints':
          setActiveTab(1);
          setFilterStatus('pending');
          break;
        case 'reopen-complaints':
          setActiveTab(1);
          setFilterStatus('reopened');
          break;
        case 'escalated-complaints':
          setActiveTab(1);
          setFilterStatus('escalated');
          break;
        case 'manage-options':
          setActiveTab(2);
          break;
        default:
          setActiveTab(0);
      }
      // Keep a simple global key for highlight in sidebar
      window.currentAdminTabKey = key;
    };

    // Set defaults
    if (!window.currentAdminTabKey) {
      window.currentAdminTabKey = 'dashboard';
    }

    window.setActiveTab = setTabByKey;
    window.getActiveTabKey = () => window.currentAdminTabKey;

    return () => {
      delete window.setActiveTab;
      delete window.getActiveTabKey;
    };
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/complaint/complaints');
      setComplaints(response.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicOptions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/dynamic-options');
      const options = response.data;
      setCategories(options.filter(opt => opt.type === 'category'));
      setDepartments(options.filter(opt => opt.type === 'department'));
      setSubCategories(options.filter(opt => opt.type === 'subCategory'));
    } catch (err) {
      console.error('Error fetching dynamic options:', err);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/complaint/complaints/${complaintId}/status`, { status: newStatus });
      fetchComplaints();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddOption = async () => {
    try {
      await axios.post('http://localhost:5000/api/dynamic-options', newOption);
      setNewOption({ type: 'category', value: '', parentCategory: '', code: '' });
      setAddOptionDialog(false);
      fetchDynamicOptions();
    } catch (err) {
      console.error('Error adding option:', err);
    }
  };

  const handleEditOption = async () => {
    try {
      await axios.put(`http://localhost:5000/api/dynamic-options/${editingOption._id}`, editingOption);
      setEditOptionDialog(false);
      setEditingOption(null);
      fetchDynamicOptions();
    } catch (err) {
      console.error('Error updating option:', err);
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      try {
        await axios.delete(`http://localhost:5000/api/dynamic-options/${optionId}`);
        fetchDynamicOptions();
      } catch (err) {
        console.error('Error deleting option:', err);
      }
    }
  };

  // Calculate statistics
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in_progress').length;
  const reopenedComplaints = complaints.filter(c => c.status === 'reopened').length;

  // Filter complaints
  const filteredComplaints = complaints.filter(complaint => {
    if (filterStatus !== 'all' && complaint.status !== filterStatus) return false;
    if (filterPriority !== 'all' && complaint.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && complaint.category !== filterCategory) return false;
    return true;
  });

  // Chart data
  const statusChartData = [
    { name: 'Resolved', value: resolvedComplaints, color: '#4caf50' },
    { name: 'Pending', value: pendingComplaints, color: '#ff9800' },
    { name: 'In Progress', value: inProgressComplaints, color: '#2196f3' },
    { name: 'Reopened', value: reopenedComplaints, color: '#f44336' }
  ];

  const priorityChartData = [
    { name: 'Urgent', value: complaints.filter(c => c.priority === 'urgent').length, color: '#d32f2f' },
    { name: 'High', value: complaints.filter(c => c.priority === 'high').length, color: '#f44336' },
    { name: 'Medium', value: complaints.filter(c => c.priority === 'medium').length, color: '#ff9800' },
    { name: 'Low', value: complaints.filter(c => c.priority === 'low').length, color: '#4caf50' }
  ];

  const categoryChartData = [
    { name: 'Facility', value: complaints.filter(c => c.category === 'facility').length, color: '#2196f3' },
    { name: 'Request', value: complaints.filter(c => c.category === 'request').length, color: '#9c27b0' },
    { name: 'Hostel', value: complaints.filter(c => c.category === 'hostel').length, color: '#ff5722' }
  ];
  
  // Build Monthly Trend dynamically from complaints data (last 6 months)
  const monthlyData = useMemo(() => {
    const monthsToShow = 6;
    const now = new Date();
    const months = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString('default', { month: 'short' }),
      });
    }

    const counts = months.reduce((acc, m) => {
      acc[m.key] = { complaints: 0, resolved: 0, month: m.month };
      return acc;
    }, {});

    complaints.forEach((c) => {
      if (!c.createdAt) return;
      const created = new Date(c.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      if (counts[key]) {
        counts[key].complaints += 1;
        if (c.status === 'resolved') counts[key].resolved += 1;
      }
    });

    return months.map((m) => counts[m.key]);
  }, [complaints]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'reopened': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 3
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                <Dashboard sx={{ mr: 2, verticalAlign: 'middle' }} />
                Admin Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage and monitor all complaints efficiently
              </Typography>
            </Box>
            <Analytics sx={{ fontSize: 60, opacity: 0.3 }} />
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => {
              setActiveTab(newValue);
              const key = newValue === 0 ? 'dashboard' : newValue === 1 ? 'all-complaints' : 'manage-options';
              window.currentAdminTabKey = key;
              // Reset status filter when switching to All Complaints tab directly
              if (newValue === 1) {
                setFilterStatus('all');
              }
            }} 
            sx={{ 
              px: 2,
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 600
              }
            }}
          >
            <Tab 
              label="Overview" 
              icon={<Dashboard />} 
              iconPosition="start"
              sx={{ flexDirection: 'row', gap: 1 }}
            />
            <Tab 
              label="All Complaints" 
              icon={<BugReport />} 
              iconPosition="start"
              sx={{ flexDirection: 'row', gap: 1 }}
            />
            <Tab 
              label="Manage Options" 
              icon={<TrendingUp />} 
              iconPosition="start"
              sx={{ flexDirection: 'row', gap: 1 }}
            />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Box>
            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  elevation={4} 
                  sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                          {totalComplaints}
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                          Total Complaints
                        </Typography>
                      </Box>
                      <BugReport sx={{ fontSize: 50, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  elevation={4} 
                  sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    color: 'white',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                          {resolvedComplaints}
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                          Resolved
                        </Typography>
                      </Box>
                      <CheckCircle sx={{ fontSize: 50, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  elevation={4} 
                  sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                    color: 'white',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                          {pendingComplaints}
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                          Pending
                        </Typography>
                      </Box>
                      <Pending sx={{ fontSize: 50, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  elevation={4} 
                  sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    color: 'white',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                          {inProgressComplaints}
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                          In Progress
                        </Typography>
                      </Box>
                      <Schedule sx={{ fontSize: 50, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#2c3e50' }}>
              <Analytics sx={{ mr: 2, verticalAlign: 'middle' }} />
              Analytics Overview
            </Typography>

            <Grid container spacing={3}>
              {/* Status Distribution Pie Chart */}
              <Grid item xs={12} lg={6}>
                <ChartCard icon={<PieChart sx={{ color: '#667eea', fontSize: 28 }} />} title="Status Distribution">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              {/* Priority Distribution Bar Chart */}
              <Grid item xs={12} lg={6}>
                <ChartCard icon={<BarChart sx={{ color: '#667eea', fontSize: 28 }} />} title="Priority Distribution">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={priorityChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ddd' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ddd' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              {/* Category Distribution */}
              <Grid item xs={12} lg={6}>
                <ChartCard icon={<ShowChart sx={{ color: '#667eea', fontSize: 28 }} />} title="Category Distribution">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ddd' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ddd' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              {/* Monthly Trend Line Chart */}
              <Grid item xs={12} lg={6}>
                <ChartCard icon={<TrendingUp sx={{ color: '#667eea', fontSize: 28 }} />} title="Monthly Trend">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eceff1" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#607d8b' }}
                        axisLine={{ stroke: '#cfd8dc' }}
                      />
                      <YAxis 
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#607d8b' }}
                        axisLine={{ stroke: '#cfd8dc' }}
                      />
                      <Tooltip 
                        formatter={(value) => [value, 'Count']}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: '1px solid #eceff1',
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line 
                        type="monotone" 
                        dataKey="complaints" 
                        name="Complaints"
                        stroke="#667eea" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resolved" 
                        name="Resolved"
                        stroke="#4caf50" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Filters */}
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#2c3e50' }}>
                Filter Complaints
              </Typography>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                      <MenuItem value="reopened">Reopened</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select 
                      value={filterPriority} 
                      onChange={(e) => setFilterPriority(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Priority</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select 
                      value={filterCategory} 
                      onChange={(e) => setFilterCategory(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      <MenuItem value="facility">Facility</MenuItem>
                      <MenuItem value="request">Request</MenuItem>
                      <MenuItem value="hostel">Hostel</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterPriority('all');
                      setFilterCategory('all');
                    }}
                    fullWidth
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#5a6fd8',
                        backgroundColor: 'rgba(102, 126, 234, 0.04)'
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Complaints Table */}
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                  Complaints ({filteredComplaints.length})
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Tracking ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredComplaints.map((complaint) => (
                      <TableRow key={complaint._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {complaint.trackingId}
                          </Typography>
                        </TableCell>
                        <TableCell>{complaint.email}</TableCell>
                        <TableCell>{complaint.department}</TableCell>
                        <TableCell>
                          <Chip 
                            label={complaint.category} 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={complaint.priority?.toUpperCase() || 'N/A'}
                            color={getPriorityColor(complaint.priority)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={complaint.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                            color={getStatusColor(complaint.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 140 }}>
                            <Select
                              value={complaint.status || 'pending'}
                              onChange={(e) => handleStatusUpdate(complaint._id, e.target.value)}
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="pending">Pending</MenuItem>
                              <MenuItem value="in_progress">In Progress</MenuItem>
                              <MenuItem value="resolved">Resolved</MenuItem>
                              <MenuItem value="reopened">Reopened</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#2c3e50' }}>
              Manage Dynamic Options
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SectionCard 
                  icon={<TrendingUp sx={{ color: '#667eea' }} />} 
                  title="Manage Options"
                  actions={null}
                >
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {/* Categories Panel */}
                    <Box sx={{ flex: '1 1 340px', minWidth: 300 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Categories</Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                          onClick={() => { setNewOption({ type: 'category', value: '', parentCategory: '', code: '' }); setAddOptionDialog(true); }}
                        >
                          Add
                        </Button>
                      </Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {categories.map((category) => (
                              <TableRow key={category._id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{category.value}</TableCell>
                                <TableCell align="right">
                                  <IconButton size="small" onClick={() => { setEditingOption(category); setEditOptionDialog(true); }} sx={{ color: '#667eea' }}>
                                    <Edit />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleDeleteOption(category._id)} sx={{ color: '#f44336' }}>
                                    <Delete />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    {/* Departments Panel */}
                    <Box sx={{ flex: '1 1 340px', minWidth: 300 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Departments</Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                          onClick={() => { setNewOption({ type: 'department', value: '', parentCategory: '', code: '' }); setAddOptionDialog(true); }}
                        >
                          Add
                        </Button>
                      </Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {departments.map((dept) => (
                              <TableRow key={dept._id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{dept.value}</TableCell>
                                <TableCell width={160}>
                                  <TextField
                                    size="small"
                                    placeholder="e.g. 24510"
                                    value={(editingOption && editingOption._id === dept._id ? (editingOption.code || '') : (dept.code || ''))}
                                    onFocus={() => { if (!editingOption || editingOption._id !== dept._id) { setEditingOption({ ...dept }); } }}
                                    onChange={(e) => setEditingOption({ ...(editingOption && editingOption._id === dept._id ? editingOption : dept), code: e.target.value })}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton size="small" title="Edit" onClick={() => { setEditingOption(dept); setEditOptionDialog(true); }} sx={{ color: '#4caf50' }}>
                                    <Edit />
                                  </IconButton>
                                  <IconButton size="small" title="Save Code" onClick={async () => { try { await axios.put(`http://localhost:5000/api/dynamic-options/${dept._id}`, { ...dept, code: editingOption && editingOption._id === dept._id ? editingOption.code : dept.code }); fetchDynamicOptions(); } catch (err) { console.error('Error saving code:', err); } }} sx={{ color: '#2e7d32' }}>
                                    <Save />
                                  </IconButton>
                                  <IconButton size="small" title="Delete" onClick={() => handleDeleteOption(dept._id)} sx={{ color: '#f44336' }}>
                                    <Delete />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    {/* Subcategories Panel */}
                    <Box sx={{ flex: '1 1 340px', minWidth: 300 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Subcategories</Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                          onClick={() => { setNewOption({ type: 'subCategory', value: '', parentCategory: '' }); setAddOptionDialog(true); }}
                        >
                          Add
                        </Button>
                      </Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Parent</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {subCategories.map((sub) => (
                              <TableRow key={sub._id} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{sub.value}</TableCell>
                                <TableCell>
                                  <Chip label={sub.parentCategory} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton size="small" onClick={() => { setEditingOption(sub); setEditOptionDialog(true); }} sx={{ color: '#ff9800' }}>
                                    <Edit />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleDeleteOption(sub._id)} sx={{ color: '#f44336' }}>
                                    <Delete />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Box>
                </SectionCard>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Add Option Dialog */}
        <Dialog 
          open={addOptionDialog} 
          onClose={() => setAddOptionDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600
          }}>
            Add New Option
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={newOption.type}
                onChange={(e) => setNewOption({ ...newOption, type: e.target.value })}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="department">Department</MenuItem>
                <MenuItem value="subCategory">Subcategory</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Value"
              value={newOption.value}
              onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {newOption.type === 'department' && (
              <TextField
                fullWidth
                label="Department Code"
                value={newOption.code}
                onChange={(e) => setNewOption({ ...newOption, code: e.target.value })}
                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}
            {newOption.type === 'subCategory' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Parent Category</InputLabel>
                <Select
                  value={newOption.parentCategory}
                  onChange={(e) => setNewOption({ ...newOption, parentCategory: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat.value}>{cat.value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setAddOptionDialog(false)}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddOption} 
              variant="contained"
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Option Dialog */}
        <Dialog 
          open={editOptionDialog} 
          onClose={() => setEditOptionDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600
          }}>
            Edit Option
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={editingOption?.type || ''}
                onChange={(e) => setEditingOption({ ...editingOption, type: e.target.value })}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="department">Department</MenuItem>
                <MenuItem value="subCategory">Subcategory</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Value"
              value={editingOption?.value || ''}
              onChange={(e) => setEditingOption({ ...editingOption, value: e.target.value })}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {editingOption?.type === 'department' && (
              <TextField
                fullWidth
                label="Department Code"
                value={editingOption?.code || ''}
                onChange={(e) => setEditingOption({ ...editingOption, code: e.target.value })}
                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}
            {editingOption?.type === 'subCategory' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Parent Category</InputLabel>
                <Select
                  value={editingOption?.parentCategory || ''}
                  onChange={(e) => setEditingOption({ ...editingOption, parentCategory: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat.value}>{cat.value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setEditOptionDialog(false)}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditOption} 
              variant="contained"
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
