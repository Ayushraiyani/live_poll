import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Typography, Box, Paper, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const socket = io("http://localhost:5000");

function PollDisplayView() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/poll/${pollId}`
        );
        setPoll(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching poll:", error);
        setError("Failed to load poll data.");
        setLoading(false);
      }
    };

    fetchPoll();

    // Join the poll room for real-time updates
    socket.emit("join poll", pollId);

    // Update the poll data when the server sends updates
    socket.on("poll update", (updatedPoll) => {
      setPoll(updatedPoll);
    });

    // Clean up the socket listener when the component unmounts
    return () => {
      socket.off("poll update");
    };
  }, [pollId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 4, maxWidth: 800, margin: "auto" }}>
        <Paper elevation={3} sx={{ padding: 3 }}>
          <Typography variant="h6" align="center" color="error">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!poll) {
    return (
      <Box sx={{ padding: 4, maxWidth: 800, margin: "auto" }}>
        <Paper elevation={3} sx={{ padding: 3 }}>
          <Typography variant="h6" align="center">
            No poll data available.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const votes = poll.votes || {};
  const chartData = {
    labels: Object.keys(votes),
    datasets: [
      {
        label: "Votes",
        data: Object.values(votes),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const totalVotes = Object.values(votes).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalParticipants = Object.keys(votes).length;

  return (
    <Box sx={{ padding: 4, maxWidth: 1200, margin: "auto" }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {poll.name}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          {/* QR Code Section */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginRight: 2,
            }}
          >
            <QRCodeSVG value={`http://localhost:3000/vote/${pollId}`} />
            <Typography variant="body1" sx={{ marginTop: 2 }}>
              Scan the QR code to vote!
            </Typography>
          </Box>

          {/* Chart Section */}
          <Box sx={{ flex: 2 }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Vote Distribution",
                  },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                  },
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </Box>
        </Box>

        <Typography variant="h6" align="center" sx={{ marginTop: 3 }}>
          Total Votes: {totalVotes} - Total Participants: {totalParticipants}
        </Typography>
      </Paper>
    </Box>
  );
}

export default PollDisplayView;
