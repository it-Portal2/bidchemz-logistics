import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './auth';

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = verifyToken(token);

    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.data.user = payload;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.email} (${user.role})`);

    socket.join(`user:${user.userId}`);

    if (user.role === 'LOGISTICS_PARTNER') {
      socket.join('partners');
    } else if (user.role === 'TRADER') {
      socket.join('traders');
    } else if (user.role === 'ADMIN') {
      socket.join('admins');
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`);
    });
  });

  console.log('✅ WebSocket server initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToPartners(event: string, data: any) {
  if (io) {
    io.to('partners').emit(event, data);
  }
}

export function emitToTraders(event: string, data: any) {
  if (io) {
    io.to('traders').emit(event, data);
  }
}

export function emitToAdmins(event: string, data: any) {
  if (io) {
    io.to('admins').emit(event, data);
  }
}

export function broadcastQuoteUpdate(quoteId: string, data: any) {
  if (io) {
    io.emit(`quote:${quoteId}:update`, data);
  }
}

export function broadcastNewOffer(quoteId: string, offer: any) {
  if (io) {
    io.emit(`quote:${quoteId}:new-offer`, offer);
  }
}
