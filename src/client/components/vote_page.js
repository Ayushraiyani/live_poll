import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import io from "socket.io-client";
import { useParams } from "react-router-dom";

const socket = io("http://localhost:5000");

function VotePage() {
  const { pollId } = useParams(); // Extract pollId from route parameters
  const [poll, setPoll] = useState(null); // Holds the poll data
  const [selectedOption, setSelectedOption] = useState(""); // Tracks selected voting option
  const [hasVoted, setHasVoted] = useState(false); // Tracks if the user has voted
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Track the current question
  const [openSnackbar, setOpenSnackbar] = useState(false); // Controls the snackbar visibility
  const [error, setError] = useState(null); // To store any errors

  useEffect(() => {
    if (!pollId) {
      console.error("Poll ID is missing or undefined");
      return;
    }

    const fetchPoll = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/poll/${pollId}`
        );
        console.log("Poll data:", response.data); // Debugging
        setPoll(response.data);
      } catch (error) {
        console.error("Error fetching poll:", error);
        setError("Failed to load poll data.");
      }
    };

    fetchPoll();

    // Join the poll room for real-time updates
    socket.emit("join poll", pollId);

    // Update the poll data when the server sends updates
    socket.on("poll update", (updatedPoll) => {
      console.log("Updated poll:", updatedPoll); // Debugging
      setPoll(updatedPoll);
    });

    // Clean up the socket listener when the component unmounts
    return () => {
      socket.off("poll update");
    };
  }, [pollId]);

  const handleVote = async () => {
    if (!poll || selectedOption === "" || hasVoted) return;

    try {
      await axios.post(`http://localhost:5000/api/vote/${pollId}`, {
        questionIndex: currentQuestionIndex,
        option: selectedOption,
      });
      setHasVoted(true); // User has now voted
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ marginTop: 4 }}>
        <Paper elevation={3} sx={{ padding: 3 }}>
          <Typography variant="h5" align="center" color="error">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        {poll && poll.questions.length > 0 ? (
          <>
            <Typography variant="h4" align="center" gutterBottom>
              {poll.questions[currentQuestionIndex].text}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Render voting options */}
              {poll.questions[currentQuestionIndex].options.map(
                (option, optionIndex) => (
                  <Button
                    key={optionIndex}
                    variant="outlined"
                    color={selectedOption === option ? "primary" : "default"}
                    sx={{
                      backgroundColor:
                        selectedOption === option ? "primary.main" : "white",
                      borderColor:
                        selectedOption === option ? "primary.main" : "gray",
                      color: selectedOption === option ? "white" : "black",
                      borderWidth: 1,
                      "&:hover": {
                        backgroundColor:
                          selectedOption === option
                            ? "primary.dark"
                            : "rgba(0, 0, 0, 0.1)",
                      },
                    }}
                    onClick={() => setSelectedOption(option)}
                    fullWidth
                  >
                    {option}
                  </Button>
                )
              )}

              {/* Submit Vote Button */}
              <Button
                variant="contained"
                color="success"
                onClick={handleVote}
                disabled={!selectedOption || hasVoted}
                fullWidth
              >
                {hasVoted ? "Vote Submitted" : "Submit Vote"}
              </Button>
            </Box>
          </>
        ) : (
          <Typography variant="h6" align="center">
            Loading poll...
          </Typography>
        )}

        {/* Snackbar for vote submission confirmation */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="success">
            Thank you for voting!
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}

export default VotePage;
