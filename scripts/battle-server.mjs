import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 5001;

// Global map of room codes to sets of WebSocket clients
const rooms = new Map();

// Helper to generate a 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('RogueDex Pokémon Battle Signaling Server is Running\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let currentRoomCode = null;
  let isHost = false;
  let clientName = 'Unknown';

  console.log('New WebSocket connection established.');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Received type: ${data.type} for room: ${data.code || 'None'}`);

      switch (data.type) {
        case 'create': {
          const code = generateRoomCode();
          currentRoomCode = code;
          isHost = true;
          clientName = data.username || 'Host';

          rooms.set(code, new Set([ws]));
          ws.send(JSON.stringify({ type: 'created', code }));
          console.log(`Room created: ${code} by ${clientName}`);
          break;
        }

        case 'join': {
          const code = data.code ? data.code.toUpperCase() : '';
          const roomClients = rooms.get(code);

          if (!roomClients) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found.' }));
            return;
          }

          if (roomClients.size >= 10) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full (max 10).' }));
            return;
          }

          currentRoomCode = code;
          isHost = false;
          clientName = data.username || 'Opponent';

          roomClients.add(ws);
          ws.send(JSON.stringify({ type: 'joined', code }));

          // Notify all other clients in the room that a player joined
          for (const client of roomClients) {
            if (client !== ws && client.readyState === ws.OPEN) {
              client.send(JSON.stringify({
                type: 'player_joined',
                username: clientName,
                playerId: data.playerId,
              }));
            }
          }
          console.log(`User ${clientName} joined room ${code}`);
          break;
        }

        case 'broadcast': {
          // Relay message to all other clients in the room
          if (!currentRoomCode) return;
          const roomClients = rooms.get(currentRoomCode);
          if (!roomClients) return;

          const payload = JSON.stringify({
            type: 'broadcast',
            sender: clientName,
            payload: data.payload,
          });

          for (const client of roomClients) {
            if (client !== ws && client.readyState === ws.OPEN) {
              client.send(payload);
            }
          }
          break;
        }

        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`Connection closed for ${clientName}`);
    if (currentRoomCode) {
      const roomClients = rooms.get(currentRoomCode);
      if (roomClients) {
        roomClients.delete(ws);
        
        // Notify other clients of disconnect
        const leavePayload = JSON.stringify({
          type: 'player_left',
          username: clientName,
          isHost,
        });

        for (const client of roomClients) {
          if (client.readyState === ws.OPEN) {
            client.send(leavePayload);
          }
        }

        if (roomClients.size === 0) {
          rooms.delete(currentRoomCode);
          console.log(`Room ${currentRoomCode} deleted because it is empty.`);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket Server is listening on port ${PORT}`);
});
