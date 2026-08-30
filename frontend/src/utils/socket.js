import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://vercel.app';
export const socketConfigurationError = null;

const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket'],
});

export default socket;
