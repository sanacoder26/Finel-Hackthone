import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL;
export const socketConfigurationError = socketUrl
  ? null
  : 'Missing VITE_SOCKET_URL. Add it in the Vercel project environment variables and redeploy.';

const socket = socketUrl
  ? io(socketUrl, {
      autoConnect: false,
      transports: ['websocket'],
    })
  : {
      connect() {},
      disconnect() {},
      emit() {},
      on() {},
      off() {},
    };

export default socket;
