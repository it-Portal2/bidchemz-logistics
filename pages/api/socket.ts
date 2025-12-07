import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import { Server as HTTPServer } from 'http';
import { initializeWebSocket } from '@/lib/websocket-server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log('Initializing WebSocket server...');
    
    const httpServer: HTTPServer = res.socket.server as any;
    const io = initializeWebSocket(httpServer);
    
    res.socket.server.io = io;
  } else {
    console.log('WebSocket server already initialized');
  }

  res.end();
}
