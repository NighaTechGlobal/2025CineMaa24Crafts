import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GiftedChat, IMessage, Send, InputToolbar, Bubble } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import { usePresence } from '../../hooks/usePresence';
import { getAuthProfile, getConversation } from '../../services/api';
import {
  connectSocket,
  joinConversation,
  leaveConversation,
  sendMessage as sendMessageSocket,
  markRead,
  emitTyping,
  onAck,
} from '../../services/socket';
import TypingIndicator from '../../components/TypingIndicator';
import { colors, spacing } from '../../styles/tokens';

export default function ChatRoomScreen({ route, navigation }: any) {
  const { conversationId, name: routeName } = route.params;
  const [profile, setProfile] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<IMessage[]>([]);
  
  const { messages: realtimeMessages, loading, refresh } = useRealtimeMessages(conversationId);
  const { typingUsers, presenceData } = usePresence(conversationId, profile?.id || '');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await getAuthProfile();
      setProfile(response.profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const data = await getConversation(conversationId);
        setConversationInfo(data);
      } catch (e) {
        console.warn('Failed to load conversation info', e);
      }
    };
    loadConversation();
  }, [conversationId]);

  // Convert messages to GiftedChat format
  const giftedChatMessages: IMessage[] = realtimeMessages.map((msg) => ({
    _id: msg.id,
    text: msg.content,
    createdAt: new Date(msg.created_at),
    user: {
      _id: msg.sender_profile_id,
      name: msg.profiles
        ? `${msg.profiles.first_name} ${msg.profiles.last_name}`
        : 'User',
      avatar: msg.profiles?.profile_photo_url || 'https://via.placeholder.com/40',
    },
  })).reverse();

  const finalMessages: IMessage[] = [...optimisticMessages, ...giftedChatMessages];

  // Ensure socket connection and room join/leave lifecycle
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await connectSocket();
        if (active) joinConversation(conversationId);
      } catch (e) {
        console.warn('Socket connect/join failed', e);
      }
    })();

    return () => {
      active = false;
      leaveConversation(conversationId);
    };
  }, [conversationId]);

  // Remove optimistic message once ACK received from server
  useEffect(() => {
    onAck((ack: any) => {
      const { clientMsgId } = ack || {};
      if (!clientMsgId) return;
      setOptimisticMessages((prev) => prev.filter((m) => m._id !== clientMsgId));
    });
  }, []);

  // Mark messages as read when latest message changes
  useEffect(() => {
    if (!profile || realtimeMessages.length === 0) return;
    const last = realtimeMessages[realtimeMessages.length - 1];
    if (last?.id) {
      try {
        markRead(conversationId, last.id);
      } catch (e) {
        console.warn('Failed to mark read', e);
      }
    }
  }, [realtimeMessages, profile, conversationId]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!profile) return;

      const message = newMessages[0];
      try {
        const clientMsgId = await sendMessageSocket(conversationId, message.text);
        const optimistic: IMessage = {
          _id: clientMsgId,
          text: message.text,
          createdAt: new Date(),
          user: {
            _id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            avatar: profile.profile_photo_url,
          },
          pending: true as any,
        };
        setOptimisticMessages((prev) => [optimistic, ...prev]);
        // Message will be added via realtime subscription
        emitTyping(conversationId, false);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [profile, conversationId]
  );

  const handleInputTextChanged = (text: string) => {
    setInputText(text);
    
    // Throttle typing indicator updates
    if (text.length > 0) {
      emitTyping(conversationId, true);
      
      // Auto-stop typing after 3 seconds of no input
      setTimeout(() => {
        emitTyping(conversationId, false);
      }, 3000);
    } else {
      emitTyping(conversationId, false);
    }
  };

  const renderSend = (props: any) => (
    <Send {...props}>
      <View style={styles.sendButton}>
        <Ionicons name="send" size={24} color={colors.primary} />
      </View>
    </Send>
  );

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={styles.inputPrimary}
    />
  );

  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        left: { backgroundColor: '#F3F4F6' },
        right: { backgroundColor: colors.primary, paddingHorizontal: 8 },
      }}
      textStyle={{
        left: { color: colors.text },
        right: { color: '#fff' },
      }}
    />
  );

  const renderFooter = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>Someone is typing</Text>
        <TypingIndicator />
      </View>
    );
  };

  const otherParticipants = (conversationInfo?.conversation_members || [])
    .filter((m: any) => m.profile_id !== profile?.id)
    .map((m: any) => m.profile_id);

  const isSomeoneOnline = (() => {
    const now = Date.now();
    return presenceData?.some((p: any) => {
      if (!otherParticipants.includes(p.profile_id)) return false;
      const last = new Date(p.last_seen_at).getTime();
      return now - last < 60000; // within 60s considered online
    });
  })();

  const headerName = routeName || (conversationInfo?.is_group ? conversationInfo?.name : (() => {
    const other = (conversationInfo?.conversation_members || []).find((m: any) => m.profile_id !== profile?.id);
    const user = other?.profiles;
    return user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Chat';
  })());

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>{headerName}</Text>
        <View style={styles.headerStatusRow}>
          <View style={[styles.statusDot, isSomeoneOnline ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.headerStatusText}>{typingUsers.length > 0 ? 'Typing…' : isSomeoneOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>
      <View style={{ width: 24 }} />
    </View>
  );

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <GiftedChat
      messages={finalMessages}
      onSend={(messages) => onSend(messages)}
      onInputTextChanged={handleInputTextChanged}
      user={{
        _id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        avatar: profile.profile_photo_url,
      }}
      renderSend={renderSend}
      renderInputToolbar={renderInputToolbar}
      renderBubble={renderBubble}
      renderFooter={renderFooter}
      alwaysShowSend
      placeholder="Type a message..."
      messagesContainerStyle={styles.messagesContainer}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  textInput: {
    color: colors.text,
    paddingTop: spacing.sm,
  },
  messagesContainer: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: spacing.md + 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerBack: { padding: spacing.xs },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerStatusText: { fontSize: 12, color: colors.textSecondary, marginLeft: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusOnline: { backgroundColor: '#10B981' },
  statusOffline: { backgroundColor: colors.border },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});








