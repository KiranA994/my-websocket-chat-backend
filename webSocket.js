const http = require('http');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { v4: uuidv4 } = require('uuid');
const { WebSocketServer } = require('ws');
const { router: authRoutes, secretKey } = require('./routes/auth');
const ChatMessage = require('./models/ChatMessage');
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const mongoose = require('mongoose');
app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);

dotenv.config();
connectDB();

const users = new Map();

const broadcast = (data, excludeId = null) => {
  const message = JSON.stringify(data);
  for (const [uuid, user] of users.entries()) {
    if (uuid !== excludeId) {
      user.connection.send(message);
    }
  }
};

const handleMessage = async (rawMessage, ws, uuid = null) => {
  try {
    const data = JSON.parse(rawMessage.toString());

    if (data.type === 'auth') {
      const decoded = jwt.verify(data.token, secretKey);
      const { username, userId } = decoded;

      if (!username || !userId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
        ws.close(1008, 'Invalid token');
        return;
      }

      const newUuid = uuidv4();
      users.set(newUuid, {
        username,
        userId: new mongoose.Types.ObjectId(userId),
        connection: ws,
      });

      console.log(`${username} authenticated`);

      // Send message history
      const history = await ChatMessage.find().sort({ createdAt: -1 }).limit(50).lean();
      ws.send(JSON.stringify({ type: 'history', payload: history.reverse() }));

      broadcast(
        { type: 'user_joined', payload: { uuid: newUuid, username } },
        newUuid
      );

      // Attach uuid to the connection for future messages
      ws._uuid = newUuid;
      return;
    }

    // Only proceed if authenticated
    if (!uuid || !users.has(uuid)) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
      return;
    }

    const user = users.get(uuid);
    if (!data.text) return;

    const messageDoc = new ChatMessage({
      userId: user.userId,
      username: user.username,
      text: data.text,
    });

    const savedMessage = await messageDoc.save();

    broadcast({
      type: 'message',
      payload: {
        userId: savedMessage.userId,
        username: savedMessage.username,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      },
    });

  } catch (err) {
    console.error('Error handling message:', err.message);
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid request' }));
  }
};

const handleClose = (ws) => {
  const uuid = ws._uuid;
  const user = users.get(uuid);
  if (user) {
    console.log(`${user.username} disconnected`);
    users.delete(uuid);

    broadcast({
      type: 'user_left',
      payload: { uuid, username: user.username },
    });
  }
};

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const uuid = ws._uuid || null;
    handleMessage(msg, ws, uuid);
  });

  ws.on('close', () => handleClose(ws));
});


server.listen(8000, () => {
  console.log("WebSocket server listening on port 8000");
});