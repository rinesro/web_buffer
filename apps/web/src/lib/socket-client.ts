import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

/** Returns the shared socket, (re)connecting it with the given access token if needed. */
export function getSocket(accessToken: string): Socket {
  if (socket && socket.auth && (socket.auth as { token?: string }).token === accessToken) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket?.disconnect();
  socket = io(WS_URL, {
    auth: { token: accessToken },
    autoConnect: true,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
