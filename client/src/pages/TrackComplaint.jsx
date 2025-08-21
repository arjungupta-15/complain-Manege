import React, { useEffect, useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Box,
  Chip,
  Divider,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from "@mui/lab";
import {
  Email,
  Apartment,
  AccessTime,
  CheckCircle,
  HourglassEmpty,
  PriorityHigh,
} from "@mui/icons-material";
import axios from 'axios'; // Import axios
import { useLocation } from 'react-router-dom';

// Utility functions
const getStatusColor = (status) => {
  switch (status) {
    case "resolved":
      return "success";
    case "in progress":
      return "warning";
    case "pending":
      return "info";
    case "reopened":
      return "error";
    case "escalated":
      return "error";
    default:
      return "default";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "urgent":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "default";
  }
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case "urgent":
    case "high":
      return <PriorityHigh />;
    case "medium":
      return <HourglassEmpty />;
    case "low":
      return <CheckCircle />;
    default:
      return <AccessTime />;
  }
};

const getTimelineEvents = (complaint) => {
  const events = [
    {
      title: "Complaint Registered",
      description: complaint.description,
      time: new Date(complaint.submittedAt).toLocaleString(),
      icon: <CheckCircle />,
      color: "primary",
    },
  ];

  if (complaint.status === "in progress") {
    events.push({
      title: "In Progress",
      description: "Your complaint is currently being addressed.",
      time: complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : 'N/A',
      icon: <HourglassEmpty />,
      color: "warning",
    });
  }

  if (complaint.status === "resolved") {
    // Add in-progress event if updated date is available and different from submitted
    if (complaint.updatedAt && complaint.updatedAt !== complaint.submittedAt) {
      events.push({
        title: "In Progress",
        description: "Your complaint was being worked on.",
        time: new Date(complaint.updatedAt).toLocaleString(),
        icon: <HourglassEmpty />,
        color: "warning",
      });
    }
    events.push(
      {
        title: "Resolved",
        description: "Issue resolved successfully.",
        time: complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString() : 'N/A',
        icon: <CheckCircle />,
        color: "success",
      }
    );
  }

  return events;
};

const TrackComplaint = () => {
  const [trackingId, setTrackingId] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    if (idParam) {
      setTrackingId(idParam);
      // auto-track when navigated with id param
      handleTrack(idParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrack = async (idOverride) => {
    setError("");
    setComplaint(null);
    setLoading(true);

    const idToUse = (idOverride ?? trackingId).trim();
    if (!idToUse) {
      setError("Please enter a Tracking ID.");
      setLoading(false);
      return;
    }

    try {
      // Fetch by trackingId
      const response = await axios.get(`https://complain-manege.onrender.com/api/complaint/by-tracking/${idToUse}`);
      setComplaint(response.data);
    } catch (err) {
      console.error("Error tracking complaint:", err);
      setError(err.response?.data?.message || "Complaint not found. Please check the Tracking ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3, minHeight: '100vh', py: 4 }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign="center"
        sx={{ mb: 4 }}
      >
      
      </Typography>

<Card sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 4 }}>
  <Typography
    variant="h4"
    fontWeight="bold"
    textAlign="center"
    sx={{ mb: 3 }}
  >
    🛠️ Track Your Complaint
  </Typography>

  <Stack
    direction={isMobile ? "column" : "row"}
    spacing={2}
    justifyContent="center"
    alignItems="center"
  >
    <TextField
      label="Enter Tracking ID"
      value={trackingId}
      onChange={(e) => setTrackingId(e.target.value)}
      variant="outlined"
      sx={{ flex: 1, minWidth: 250 }}
    />
    <Button
      variant="contained"
      onClick={() => handleTrack()}
      size="large"
      sx={{ px: 4 }}
      disabled={loading}
    >
      {loading ? 'Tracking...' : 'Track'}
    </Button>
  </Stack>

  {error && (
    <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
      {error}
    </Typography>
  )}
</Card>


      {complaint && (
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            📝 Complaint Details
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2">Tracking ID</Typography>
              <Typography variant="body1">{complaint._id}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Department</Typography>
              <Typography variant="body1">
                <Apartment sx={{ mr: 1, verticalAlign: "middle" }} />
                {complaint.department}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Registered Email</Typography>
              <Typography variant="body1">
                <Email sx={{ mr: 1, verticalAlign: "middle" }} />
                {complaint.email}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Category</Typography>
              <Typography variant="body1">{complaint.category}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Sub-Category</Typography>
              <Typography variant="body1">{complaint.subCategory}</Typography>
            </Box>

            {complaint.subOther && (
              <Box>
                <Typography variant="subtitle2">Other Details</Typography>
                <Typography variant="body1">{complaint.subOther}</Typography>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2">Description</Typography>
              <Typography variant="body1">{complaint.description}</Typography>
            </Box>

            <Stack direction="row" spacing={2} mt={2}>
              <Chip
                label={`Status: ${complaint.status.toUpperCase()}`}
                color={getStatusColor(complaint.status)}
              />
              <Chip
                icon={getPriorityIcon(complaint.priority)}
                label={`Priority: ${complaint.priority.toUpperCase()}`}
                color={getPriorityColor(complaint.priority)}
              />
            </Stack>

            <Box>
              <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>
                📅 Complaint Timeline
              </Typography>

              <Timeline position="alternate">
                {getTimelineEvents(complaint).map((event, index) => (
                  <TimelineItem key={index}>
                    <TimelineOppositeContent
                      sx={{
                        flex: 0.2,
                        color: "text.secondary",
                        fontSize: "0.8rem",
                        textAlign: "right",
                      }}
                    >
                      {event.time}
                    </TimelineOppositeContent>

                    <TimelineSeparator>
                      <TimelineDot
                        color={event.color}
                        sx={{ boxShadow: 2, width: 18, height: 18 }}
                      >
                        {event.icon}
                      </TimelineDot>
                      {index < getTimelineEvents(complaint).length - 1 && (
                        <TimelineConnector sx={{ bgcolor: "grey.400" }} />
                      )}
                    </TimelineSeparator>

                    <TimelineContent sx={{ py: 1 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "#f9fafb",
                          boxShadow: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ color: "text.primary" }}
                        >
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {event.description}
                        </Typography>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Box>
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default TrackComplaint;
