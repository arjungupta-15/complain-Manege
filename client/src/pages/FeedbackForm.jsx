import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import axios from "axios";

const FeedbackForm = () => {
  const [rating, setRating] = useState(0);
  const [formData, setFormData] = useState({
    complaintId: "",
    feedback: "",
    resolution: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "https://complain-manege.onrender.com/api/submit_feedback",
        {
          complaintId: formData.complaintId,
          feedback: formData.feedback,
          resolution: formData.resolution,
          rating,
        }
      );
      setSuccess(response.data.message);
      // Reset form
      setFormData({ complaintId: "", feedback: "", resolution: "" });
      setRating(0);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to submit feedback. Please try again."
      );
    }
  };

  return (
    <Box sx={{ backgroundColor: "#f9fafc", minHeight: "100vh", py: 5, overflow: 'auto' }}>
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: "white",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          }}
        >
          <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
            Feedback & Resolution
          </Typography>
          <Divider sx={{ my: 2 }} />

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Complaint ID"
              name="complaintId"
              value={formData.complaintId}
              onChange={handleInputChange}
              required
              margin="normal"
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Feedback"
              name="feedback"
              value={formData.feedback}
              onChange={handleInputChange}
              multiline
              rows={4}
              required
              margin="normal"
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Resolution"
              name="resolution"
              value={formData.resolution}
              onChange={handleInputChange}
              multiline
              rows={4}
              required
              margin="normal"
              variant="outlined"
            />

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Rate your resolution:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, fontSize: "2rem" }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <span
                    key={value}
                    onClick={() => handleStarClick(value)}
                    style={{
                      cursor: "pointer",
                      color: rating >= value ? "#FFD700" : "#ccc",
                      transition: "color 0.2s",
                    }}
                  >
                    {rating >= value ? "★" : "☆"}
                  </span>
                ))}
              </Box>
            </Box>

            <input type="hidden" name="rating" value={rating} />

            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: "#0a4482",
                  px: 5,
                  py: 1.5,
                  fontWeight: "bold",
                  "&:hover": { backgroundColor: "#003c7a" },
                }}
              >
                Submit Feedback
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default FeedbackForm;