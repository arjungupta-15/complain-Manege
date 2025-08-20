import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Container,
  Paper,
  Chip,
  Divider,
  Button,
} from "@mui/material";


const getStatusColor = (status) => {
  switch (status) {
    case "resolved":
      return "success";
    case "in progress":
      return "warning";
    case "pending":
      return "default";
    default:
      return "info";
  }
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyComplaints = async () => {
      if (!user?.email) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/complaint/complaints-by-email`, { params: { email: user.email } });
        setComplaints(res.data.map((c, idx) => ({
          id: c._id,
          tracking_id: c.trackingId,
          email: c.email,
          category: c.category,
          status: c.status?.replace('_', ' '),
          created_at: new Date(c.createdAt || c.submittedAt).toLocaleDateString(),
        })));
      } catch (e) {
        setError('Failed to load your complaints');
      }
    };
    fetchMyComplaints();
  }, [user?.email]);

  const goToTrack = (trackingId) => {
    if (!trackingId) return;
    navigate(`/track-complaint?id=${trackingId}`);
  };

  const handleAction = (id, action) => {
    const name = complaints.find((c) => c.id === id)?.tracking_id;
    if (action === 'reopen') {
      alert(`Complaint ${name} reopened.`);
    } else if (action === 'escalate') {
      alert(`Complaint ${name} escalated.`);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f4f7fa", minHeight: "100vh", py: 5 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            backgroundColor: "#ffffff",
          }}
        >
          <Typography
            variant="h4"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#0a3d62" }}
          >
            🎓 Student Dashboard
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ mb: 3, color: "#34495e" }}>My Complaints</Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          )}

          <Table sx={{ borderRadius: 2 }}>
            <TableHead sx={{ backgroundColor: "#ecf0f1" }}>
              <TableRow>
                <TableCell><b>Tracking ID</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Category</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Created At</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint.id} hover>
                  <TableCell>{complaint.tracking_id}</TableCell>
                  <TableCell>{complaint.email}</TableCell>
                  <TableCell>{complaint.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={complaint.status.toUpperCase()}
                      color={getStatusColor(complaint.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{complaint.created_at}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => handleAction(complaint.id, 'reopen')}
                      >
                        Reopen
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleAction(complaint.id, 'escalate')}
                      >
                        Escalate
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>
    </Box>
  );
};

export default StudentDashboard;
