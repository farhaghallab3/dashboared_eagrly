import { useState } from 'react';
import apiClient from '../services/apiClient';

export function useChatbot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const send = async (message: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.sendChatbotMessage(message);
      return res.reply;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { send, loading, error } as const;
}

export default useChatbot;
