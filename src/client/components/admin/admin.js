import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Container,
  Paper,
  Divider,
  Link,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as NextIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

function AdminView() {
  const [questions, setQuestions] = useState([
    {
      text: "",
      options: [],
      hideAnswers: false,
      showPercentage: false,
    },
  ]);
  const [pollId, setPollId] = useState("");
  const [pollStatus, setPollStatus] = useState("paused");

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        options: [],
        hideAnswers: false,
        showPercentage: false,
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (index, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addOption = (index) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].options.push("");
    setQuestions(updatedQuestions);
  };

  const createPoll = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/createPoll",
        {
          name: pollId, // Add a name for the poll or modify as needed
          questions,
        }
      );
      if (response.data.success) {
        setPollId(response.data.pollId);
        alert("Poll created successfully!");
      } else {
        alert("Failed to create poll: " + response.data.message);
      }
    } catch (error) {
      console.error("Error details:", error);
      alert(
        "Failed to create poll. Please check the console for more details."
      );
    }
  };

  const deletePoll = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/deletePoll/${pollId}`);
      alert("Poll deleted!");
      setPollId("");
      setQuestions([
        {
          text: "",
          options: [],
          hideAnswers: false,
          showPercentage: false,
        },
      ]);
      setPollStatus("paused");
    } catch (error) {
      console.error("Error deleting poll:", error);
      alert("Failed to delete poll");
    }
  };

  const resetResults = async () => {
    try {
      await axios.post(`http://localhost:5000/api/resetResults/${pollId}`);
      alert("Poll results reset!");
    } catch (error) {
      console.error("Error resetting results:", error);
      alert("Failed to reset results");
    }
  };

  const downloadResults = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/downloadResults/${pollId}`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], {
        type: "text/csv", // Correct MIME type for CSV
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "poll-results.csv"; // Use CSV file extension
      link.click();
    } catch (error) {
      console.error("Error downloading results:", error);
      alert("Failed to download results");
    }
  };
  const handlePollStatusChange = async (status) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/updatePollStatus",
        {
          id: pollId, // Ensure pollId is correctly passed
          status,
        }
      );
      if (response.data.success) {
        setPollStatus(status); // Update the local state with the new status
      } else {
        alert("Failed to update poll status");
      }
    } catch (error) {
      console.error("Error updating poll status:", error);
      alert("Failed to update poll status");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Admin Dashboard
        </Typography>

        <Divider sx={{ marginY: 3 }} />

        <Typography variant="h5" gutterBottom>
          Poll Control
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayIcon />}
            onClick={() => handlePollStatusChange("playing")}
            disabled={pollStatus === "playing"}
          >
            Play
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<PauseIcon />}
            onClick={() => handlePollStatusChange("paused")}
            disabled={pollStatus === "paused"}
          >
            Pause
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<NextIcon />}
            onClick={() => handlePollStatusChange("next")}
            disabled={pollStatus !== "playing"}
          >
            Next Question
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={() => handlePollStatusChange("stopped")}
            disabled={pollStatus === "stopped"}
          >
            Stop Poll
          </Button>
        </Box>

        <Divider sx={{ marginY: 3 }} />

        <Typography variant="h5" gutterBottom>
          Poll URL and Settings
        </Typography>
        <TextField
          label="Poll ID"
          variant="outlined"
          fullWidth
          margin="normal"
          value={pollId}
          onChange={(e) => setPollId(e.target.value)}
          sx={{ marginBottom: 2 }}
        />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            marginBottom: 2,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={createPoll} // Use createPoll to save
          >
            Save Poll
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={deletePoll}
          >
            Delete Poll
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<RefreshIcon />}
            onClick={resetResults}
          >
            Reset Results
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<DownloadIcon />}
            onClick={downloadResults}
          >
            Download Results
          </Button>
        </Box>

        <Divider sx={{ marginY: 3 }} />

        <Typography variant="h5" gutterBottom>
          Poll Questions
        </Typography>
        {questions.map((question, index) => (
          <Paper key={index} sx={{ padding: 2, marginBottom: 2 }}>
            <Typography variant="h6" gutterBottom>
              Question {index + 1}
            </Typography>
            <TextField
              label="Question"
              variant="outlined"
              fullWidth
              margin="normal"
              value={question.text}
              onChange={(e) =>
                handleQuestionChange(index, "text", e.target.value)
              }
              sx={{ marginBottom: 2 }}
            />
            {question.options.map((option, optionIndex) => (
              <TextField
                key={optionIndex}
                label={`Option ${optionIndex + 1}`}
                variant="outlined"
                fullWidth
                margin="normal"
                value={option}
                onChange={(e) =>
                  handleOptionChange(index, optionIndex, e.target.value)
                }
                sx={{ marginBottom: 1 }}
              />
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addOption(index)}
              sx={{ marginBottom: 2 }}
            >
              Add Option
            </Button>

            <Box sx={{ marginTop: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={question.hideAnswers}
                    onChange={(e) =>
                      handleQuestionChange(
                        index,
                        "hideAnswers",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Hide answers while polling"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={question.showPercentage}
                    onChange={(e) =>
                      handleQuestionChange(
                        index,
                        "showPercentage",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Show results in %"
              />
            </Box>
          </Paper>
        ))}
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={addQuestion}
        >
          Add Question
        </Button>
      </Paper>

      <Box sx={{ marginTop: 4 }}>
        <Paper elevation={2} sx={{ padding: 2, marginBottom: 3 }}>
          <Typography variant="h5" gutterBottom>
            Links Section
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Link href={`/poll/${pollId}`} underline="hover" color="primary">
              View Poll
            </Link>
            <Link href={`/vote/${pollId}`} underline="hover" color="primary">
              Vote on Poll
            </Link>
            <Link href={`/admin/${pollId}`} underline="hover" color="primary">
              Admin Page
            </Link>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ marginTop: 4 }}>
        <Paper elevation={2} sx={{ padding: 2 }}>
          <Typography variant="h5" gutterBottom>
            Poll View Page
          </Typography>
          <Typography variant="body1">
            You can manage the polls and see their details here. Adjust
            settings, add questions, and more.
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ marginTop: 2, marginBottom: 10 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={createPoll}
          sx={{ width: "100%" }}
        >
          Create Poll
        </Button>
      </Box>
    </Container>
  );
}

export default AdminView;
