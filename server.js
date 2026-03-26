import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Map<inviteCode, { players: [{socketId, name}], gameState, stockpileSize }>
const rooms = new Map();

function generateCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // Host creates a room
  socket.on('create-game', ({ stockpileSize, playerName }) => {
    let code;
    do {
      code = generateCode();
    } while (rooms.has(code));

    rooms.set(code, {
      players: [{ socketId: socket.id, name: playerName || 'Spieler 1' }],
      gameState: null,
      stockpileSize: stockpileSize ?? 20,
    });

    socket.join(code);
    socket.data.room = code;
    socket.data.playerIndex = 0;

    socket.emit('room-created', { code, playerIndex: 0 });
    console.log(`[Room] Created: ${code} by ${playerName}`);
  });

  // Guest joins a room
  socket.on('join-game', ({ code, playerName }) => {
    const room = rooms.get(code?.toUpperCase());

    if (!room) {
      socket.emit('join-error', { message: 'Raum nicht gefunden. Bitte Code prüfen.' });
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('join-error', { message: 'Dieser Raum ist bereits voll.' });
      return;
    }

    room.players.push({ socketId: socket.id, name: playerName || 'Spieler 2' });
    socket.join(code.toUpperCase());
    socket.data.room = code.toUpperCase();
    socket.data.playerIndex = 1;

    const [host, guest] = room.players;

    // Tell host to start (they initialize the game state)
    io.to(host.socketId).emit('game-start', {
      playerIndex: 0,
      opponentName: guest.name,
      stockpileSize: room.stockpileSize,
    });

    // Tell guest to start (they wait for state from host)
    socket.emit('game-start', {
      playerIndex: 1,
      opponentName: host.name,
      stockpileSize: room.stockpileSize,
    });

    console.log(`[Room] Game started: ${code} | ${host.name} vs ${guest.name}`);
  });

  // A player sends their updated game state after a move
  socket.on('send-state', ({ gameState }) => {
    const code = socket.data.room;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    room.gameState = gameState;
    // Relay to the OTHER player only
    socket.to(code).emit('state-update', { gameState });
  });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    const code = socket.data.room;
    if (code) {
      console.log(`[-] Client disconnected: ${socket.id} from room ${code}`);
      socket.to(code).emit('opponent-left');
      rooms.delete(code);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🃏 Stack-Bo Server läuft auf Port ${PORT}\n`);
});
