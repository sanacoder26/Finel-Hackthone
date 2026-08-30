import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL;

if (!socketUrl) {
  throw new Error('Missing VITE_SOCKET_URL environment variable');
}

const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket'],
});

export default socket;
