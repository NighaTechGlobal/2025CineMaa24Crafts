import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { updatePresence, updateTyping } from '../services/api';

export function usePresence(conversationId: string, profileId: string) {
  const [presenceData, setPresenceData] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      updatePresence(conversationId).catch(console.error);
    }, 30000);

    // Subscribe to presence changes
    const channel = supabase
      .channel(`presence-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newPresence = payload.new;
            
            setPresenceData((prev) => {
              const filtered = prev.filter((p) => p.profile_id !== newPresence.profile_id);
              return [...filtered, newPresence];
            });

            // Update typing users
            if (newPresence.is_typing && newPresence.profile_id !== profileId) {
              setTypingUsers((prev) => new Set(prev).add(newPresence.profile_id));
              
              // Clear typing after 5 seconds
              setTimeout(() => {
                setTypingUsers((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(newPresence.profile_id);
                  return newSet;
                });
              }, 5000);
            } else {
              setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(newPresence.profile_id);
                return newSet;
              });
            }
          }
        }
      )
      .subscribe();

    // Initial presence update
    updatePresence(conversationId).catch(console.error);

    return () => {
      clearInterval(heartbeatInterval);
      supabase.removeChannel(channel);
    };
  }, [conversationId, profileId]);

  const setTyping = async (isTyping: boolean) => {
    try {
      await updateTyping(conversationId, isTyping);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  return {
    presenceData,
    typingUsers: Array.from(typingUsers),
    setTyping,
  };
}

