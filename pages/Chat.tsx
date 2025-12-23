import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as chatsApi from '../services/api/chats';
import * as messagesApi from '../services/api/messages';

interface ApiMessage { id: number | string; chat: number; sender: number; text: string; created_at: string }

const Chat: React.FC = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const seller = params.get('seller') || '';
  const seller_name = params.get('seller_name') || 'Owner';
  const product = params.get('product') || '';

  const { user } = useAuth();

  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Ensure we always call hooks in the same order above

  useEffect(() => {
    let mounted = true;
    const initChat = async () => {
      setLoading(true);
      try {
        if (!user) {
          throw new Error('You must be logged in to start a chat');
        }

        // First, try to find existing chats for this product and participant
        const listParams: any = { buyer: user.id };
        if (product) listParams.product = product;
        if (seller) listParams.seller = Number(seller);

        let chat: any = null;
        try {
          const existing = await chatsApi.fetchChats(listParams);
          if (existing && existing.length > 0) chat = existing[0];
        } catch (e) {
          // ignore list errors and fall back to create
          console.debug('Failed to list chats', e);
        }

        if (!chat) {
          const payload: any = { buyer: user.id, seller: seller ? Number(seller) : undefined, product: product || undefined };
          chat = await chatsApi.createChat(payload);
        }

        if (!mounted) return;
        setChatId(chat.id ?? chat.pk ?? chat.id);

        // fetch messages for chat
        const msgs = await messagesApi.fetchMessages({ chat: chat.id });
        if (!mounted) return;
        // normalize msg fields
        setMessages(msgs.map((m: any) => ({ id: m.id, chat: m.chat, sender: m.sender, text: m.text ?? m.body ?? m.message, created_at: m.created_at ?? m.ts ?? m.timestamp })));
      } catch (err) {
        console.error('initChat error', err);
        // Better error message when available
        const msg = (err as any)?.response?.data?.detail || (err as any)?.response?.data || (err as any)?.message || 'Failed to initialize chat';
        const status = (err as any)?.response?.status;
        toast.error(`Failed to initialize chat${status ? ` (status ${status})` : ''}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initChat();
    return () => { mounted = false; };
  }, [seller, product]);

  useEffect(() => {
    // scroll to bottom when messages change
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const formatDate = (val: any) => {
    if (!val && val !== 0) return '';
    try {
      const d = typeof val === 'number' ? new Date(val) : new Date(String(val));
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleString();
    } catch (e) {
      return String(val);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !chatId) return;
    try {
      setSending(true);
      const payload: any = { chat: chatId, text };
      const res = await messagesApi.createMessage(payload);
      // append server message
      setMessages(prev => [...prev, { id: res.id, chat: res.chat, sender: res.sender, text: res.text || res.message || res.body, created_at: res.created_at || res.ts }]);
      setText('');
    } catch (err) {
      console.error('sendMessage error', err);
      const msg = (err as any)?.response?.data?.detail || (err as any)?.response?.data || (err as any)?.message || 'Failed to send message';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 w-full mx-auto">
        <h2 className="text-white text-2xl mb-2">Chat with {seller_name}</h2>
        <p className="text-white/60 mb-4">Product: {product}</p>

        <div ref={listRef} className="bg-white/5 border border-white/10 rounded p-4 mb-4 h-80 overflow-y-auto">
          {loading ? (
            <div className="text-white/50">Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className="text-white/60">No messages yet. Start the conversation.</div>
          ) : (
            messages.map(m => (
              <div key={String(m.id)} className={`mb-3 ${m.sender === user?.id ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block rounded px-3 py-2 ${m.sender === user?.id ? 'bg-primary text-[#112120]' : 'bg-white/10 text-white'}`}>{m.text}</div>
                <div className="text-xs text-white/50 mt-1">{formatDate(m.created_at)}</div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded p-2 bg-black/20 border border-white/10 text-white" placeholder="Write a message..." />
          <button onClick={sendMessage} disabled={sending || !chatId} className="bg-primary text-[#112120] rounded px-4 py-2 font-bold disabled:opacity-50">{sending ? 'Sending...' : 'Send'}</button>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
