const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const { createObjectCsvWriter } = require("csv-writer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(
  "mongodb+srv://ayush_poll:ayush_poll@cluster0.wi3tq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Poll Schema
const pollSchema = new mongoose.Schema({
  name: String,
  questions: [
    {
      text: String,
      options: [String],
      hideAnswers: Boolean,
      showPercentage: Boolean,
    },
  ],
  votes: { type: Map, of: Number },
  status: { type: String, default: "paused" },
});

// Poll Model
const Poll = mongoose.model("Poll", pollSchema);

// Create Poll Route
app.post("/api/createPoll", async (req, res) => {
  const { name, questions, hideAnswers, showPercentage } = req.body;

  const newPoll = new Poll({
    name,
    questions,
    votes: new Map(), // Initialize votes as a Map
    hideAnswers,
    showPercentage,
  });

  try {
    await newPoll.save();
    const updatedPoll = await Poll.findById(newPoll._id);
    io.to(newPoll._id.toString()).emit("poll update", updatedPoll); // Emit to specific room
    res.send({ success: true, pollId: newPoll._id });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Get Poll Route
app.get("/api/poll/:pollId", async (req, res) => {
  const { pollId } = req.params;
  console.log("Fetching poll with ID:", pollId); // Debugging
  if (!pollId || !mongoose.Types.ObjectId.isValid(pollId)) {
    return res.status(400).send("Invalid pollId format");
  }

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).send("Poll not found");
    }
    res.send(poll);
  } catch (error) {
    console.error("Error fetching poll:", error);
    res.status(500).send("Internal server error");
  }
});

// Vote Route
app.post("/api/vote/:pollId", async (req, res) => {
  const { pollId } = req.params;
  console.log("Voting on poll with ID:", pollId); // Debugging
  const { questionIndex, option } = req.body;

  try {
    if (!pollId || !mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).send("Invalid pollId format");
    }
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).send("Poll not found");

    const question = poll.questions[questionIndex];
    if (!question) return res.status(400).send("Invalid question index");

    const currentVotes = poll.votes.get(option) || 0;
    poll.votes.set(option, currentVotes + 1);
    await poll.save();

    const updatedPoll = await Poll.findById(pollId);
    io.to(pollId).emit("poll update", updatedPoll); // Emit to specific room

    res.send({ success: true });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Update Poll Status Route
app.post("/api/updatePollStatus", async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) return res.status(400).send("Invalid input");

  try {
    const poll = await Poll.findById(id);
    if (!poll) return res.status(404).send("Poll not found");

    poll.status = status;
    await poll.save();

    io.to(id).emit("poll update", poll); // Emit to specific room
    res.send({ success: true });
  } catch (error) {
    console.error("Error updating poll status:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Pause Poll Route
app.post("/api/pausePoll/:pollId", async (req, res) => {
  const { pollId } = req.params;

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).send("Poll not found");

    poll.status = "paused";
    await poll.save();

    // Fetch the updated poll
    const updatedPoll = await Poll.findById(pollId);

    // Emit event to notify clients in the room
    io.to(pollId).emit("poll update", updatedPoll);

    res.send({ success: true });
  } catch (error) {
    console.error("Error pausing poll:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Stop Poll Route
app.post("/api/stopPoll/:pollId", async (req, res) => {
  const { pollId } = req.params;

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).send("Poll not found");

    poll.status = "stopped";
    await poll.save();

    // Fetch the updated poll
    const updatedPoll = await Poll.findById(pollId);

    // Emit event to notify clients in the room
    io.to(pollId).emit("poll update", updatedPoll);

    res.send({ success: true });
  } catch (error) {
    console.error("Error stopping poll:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Download Results Route
app.get("/api/downloadResults/:pollId", async (req, res) => {
  const { pollId } = req.params;

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).send("Poll not found");

    // Format results
    const results = Array.from(poll.votes.entries()).map(([option, votes]) => ({
      option,
      votes,
    }));

    // Define path for CSV
    const filePath = path.join(__dirname, "results.csv");

    // Create CSV
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: "option", title: "Option" },
        { id: "votes", title: "Votes" },
      ],
    });

    await csvWriter.writeRecords(results);

    // Send the file to the client
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error sending CSV file:", err);
        res.status(500).send("Failed to send CSV file");
      }

      // Clean up the file after sending
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting CSV file:", err);
      });
    });
  } catch (error) {
    console.error("Error downloading results:", error);
    res.status(500).send("Failed to download results");
  }
});

// Socket.io configuration
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("join poll", (pollId) => {
    console.log(`User joined poll room: ${pollId}`);
    socket.join(pollId);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// Start server
server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
