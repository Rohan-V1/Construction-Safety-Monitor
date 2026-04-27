const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const detectionRoute = require("./routes/detection");

const app = express();
const server = http.createServer(app);

app.use("/analytics", require("./routes/analytics"));


// ✅ ENABLE CORS FOR EXPRESS (THIS FIXES FETCH)
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"]
}));

// ✅ Socket.IO CORS (already correct)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// ✅ Routes AFTER cors
app.use("/detect", detectionRoute(io));

server.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
