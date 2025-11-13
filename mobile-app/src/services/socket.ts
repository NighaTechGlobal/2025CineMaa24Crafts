import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './authStorage';

type PendingMessage = {
  conversationId: string;
  clientMsgId: string;
  content: string;
  metadata?: any;
};

let socket: Socket | null = null;
const PENDING_KEY = 'pendingMessages';

export const connectSocket = async () => {
  const token = await getToken();
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
  // Strip trailing /api for WS namespace, falling back to host root
  const wsBase = apiBase.replace(/\/api\/?$/, '');
  const url = `${wsBase.replace(/\/+$/, '')}/chat`;
  socket = io(url, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    forceNew: true,
    secure: url.startsWith('https'),
  });

  // On connect: flush any queued outgoing messages
  socket.on('connect', async () => {
    const pendingRaw = await AsyncStorage.getItem(PENDING_KEY);
    const pending: PendingMessage[] = pendingRaw ? JSON.parse(pendingRaw) : [];
    for (const msg of pending) {
      socket?.emit('send_message', msg);
    }
    await AsyncStorage.removeItem(PENDING_KEY);
  });

  // Basic error logging
  socket.on('error', (e: any) => {
    console.warn('[WS error]', e);
  });

  // Also surface connection errors explicitly
  socket.on('connect_error', (err: any) => {
    console.warn('[WS connect_error]', err?.message || err);
  });

  return socket;
};

export const joinConversation = (conversationId: string) => {
  socket?.emit('join_conversation', { conversationId });
};

export const leaveConversation = (conversationId: string) => {
  socket?.emit('leave_conversation', { conversationId });
};

export const sendMessage = async (conversationId: string, content: string, metadata?: any) => {
  const clientMsgId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload: PendingMessage = { conversationId, clientMsgId, content, metadata };

  // Optimistic UI handled by caller; emit or queue if offline
  if (socket && socket.connected) {
    socket.emit('send_message', payload);
  } else {
    const pendingRaw = await AsyncStorage.getItem(PENDING_KEY);
    const pending: PendingMessage[] = pendingRaw ? JSON.parse(pendingRaw) : [];
    pending.push(payload);
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }
  return clientMsgId;
};

export const markRead = (conversationId: string, lastMessageId: number) => {
  socket?.emit('mark_read', { conversationId, lastMessageId });
};

let typingTimer: any = null;
export const emitTyping = (conversationId: string, isTyping: boolean) => {
  // Debounce typing emit to reduce chatter
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket?.emit('typing', { conversationId, isTyping });
  }, isTyping ? 150 : 0);
};

export const onMessage = (cb: (evt: any) => void) => socket?.on('message', cb);
export const onAck = (cb: (evt: any) => void) => socket?.on('message_ack', cb);
export const onReceiptUpdate = (cb: (evt: any) => void) => socket?.on('receipt_update', cb);
export const onUserTyping = (cb: (evt: any) => void) => socket?.on('user_typing', cb);

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};