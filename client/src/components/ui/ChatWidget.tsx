import React, { useState, useEffect, useRef, useCallback } from 'react';
import { I } from '../icons';
import { getMessages, sendMessage } from '../../api/purchases';
import { useAuth } from '../../contexts/AuthContext';
import type { Message } from '../../types';

interface ChatWidgetProps {
  purchaseId: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ purchaseId }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const openRef = useRef(open);
  openRef.current = open;

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await getMessages(purchaseId);
      setMessages(msgs);
      if (!openRef.current && prevCountRef.current > 0 && msgs.length > prevCountRef.current) {
        setUnread((u) => u + (msgs.length - prevCountRef.current));
      }
      prevCountRef.current = msgs.length;
    } catch {
      // ignore
    }
  }, [purchaseId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open]);

  const handleSend = async () => {
    const content = newMsg.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(purchaseId, content);
      setMessages((prev) => [...prev, msg]);
      setNewMsg('');
      prevCountRef.current += 1;
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      {open && (
        <div className="lc-card" style={{
          width: 340, height: 420, display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden',
          transformOrigin: 'bottom right',
          animation: 'lc-scale-in 0.18s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', background: 'var(--lc-navy)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <I name="mail" size={16} stroke="#fff" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Deal Chat</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}
            >
              <I name="x" size={16} stroke="rgba(255,255,255,0.7)" />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflow: 'auto', padding: '12px 10px 6px',
            display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB',
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--lc-text-muted)', fontSize: 12, marginTop: 60 }}>
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((msg) => {
              const mine = msg.senderId === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '8px 12px',
                    borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: mine ? 'var(--lc-primary)' : '#fff',
                    color: mine ? '#fff' : 'var(--lc-text)',
                    fontSize: 13, lineHeight: 1.4,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}>
                    {!mine && (
                      <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 3, fontWeight: 600 }}>
                        {msg.sender.email.split('@')[0]}
                      </div>
                    )}
                    {msg.content}
                    <div style={{ fontSize: 10, opacity: 0.45, marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 10px', borderTop: '1px solid var(--lc-border-subtle)',
            display: 'flex', gap: 8, flexShrink: 0, background: '#fff',
          }}>
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Type a message…"
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8,
                border: '1.5px solid var(--lc-border)', fontSize: 13,
                outline: 'none', background: '#fff', color: 'var(--lc-text)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--lc-primary)', border: 'none', color: '#fff',
                cursor: !newMsg.trim() || sending ? 'not-allowed' : 'pointer',
                opacity: !newMsg.trim() || sending ? 0.5 : 1,
                display: 'flex', alignItems: 'center',
              }}
            >
              <I name="arrowRight" size={16} stroke="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 52, height: 52, borderRadius: 999,
          background: 'var(--lc-primary)', border: 'none',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(61,179,73,0.4)', cursor: 'pointer',
          position: 'relative', transition: 'transform 0.2s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      >
        <I name={open ? 'x' : 'mail'} size={22} stroke="#fff" />
        {unread > 0 && !open && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: 999,
            background: 'var(--lc-danger)', border: '2px solid #fff',
            color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
    </div>
  );
};
