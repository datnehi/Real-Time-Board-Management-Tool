const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// ROUTES
app.use('/auth', require('./routes/auth.route'));
app.use('/boards', require('./routes/board.route'));
app.use('/boards/:boardId/cards', require('./routes/card.route'));
app.use('/boards/:boardId/cards/:cardId/tasks', require('./routes/task.route'));

// SOCKET.IO connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join_board', (boardId) => {
    socket.join(boardId);
    console.log(`✅ Socket ${socket.id} joined board: ${boardId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
