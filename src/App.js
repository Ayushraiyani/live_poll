import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AdminView from "./client/components/admin/admin";
import PollDisplayView from "./client/components/poll_page";
import VotePage from "./client/components/vote_page";
import { Box, Typography } from "@mui/material";

function App() {
  return (
    <Router>
      <Box
        className="App"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // justifyContent: "center",
          minHeight: "100vh",
          padding: 2,
        }}
      >
        <Typography variant="h3" gutterBottom>
          Live Parents Vote
        </Typography>
        <Box
          component="main"
          sx={{
            width: "100%",
            maxWidth: "1200px", // Adjust as needed
            padding: 2,
            boxShadow: 3, // Optional shadow for visual enhancement
            borderRadius: 1,
          }}
        >
          <Routes>
            <Route path="/" element={<AdminView />} />
            <Route path="/poll/:pollId" element={<PollDisplayView />} />
            <Route path="/vote/:pollId" element={<VotePage />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
