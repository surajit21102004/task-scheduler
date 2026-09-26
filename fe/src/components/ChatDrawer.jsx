import React, { useState, useEffect } from 'react';
import api from '../services/api';
import supabase from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { X, Send, MessageSquare, Trash2 } from 'lucide-react';

const ChatDrawer = ({ task, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (task) {
      fetchTaskComments();
    }
  }, [task]);

  // Realtime WebSocket Subscription for task discussion comments
  useEffect(() => {
    if (!task) return;

    const channel = supabase
      .channel(`task_comments_${task.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workplace_messages',
          filter: `task_id=eq.${task.id}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'workplace_messages',
          filter: `task_id=eq.${task.id}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [task]);

  const fetchTaskComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/task/${task.id}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load task discussion:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !task) return;

    setSending(true);
    try {
      const res = await api.post('/messages', {
        task_id: task.id,
        content: newMessage.trim(),
      });

      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (msgId) => {
    if (!window.confirm('Delete this comment from database?')) return;
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success('Comment deleted from database.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete comment.');
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Task Discussion
          </h3>
          <p className="text-[11px] text-blue-700 font-bold truncate max-w-xs">{task.title}</p>
        </div>

        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs font-medium">
            No discussion comments yet on this task. Be the first to comment!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            const canDelete = user?.role === 'admin' || isMe;
            return (
              <div key={msg.id} className="pro-card p-3 space-y-1 bg-white relative group">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-blue-700">{msg.sender?.name || 'Team Member'}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(msg.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Delete comment from database"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">{msg.content}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendComment} className="p-3 border-t border-slate-200 flex gap-2 bg-slate-50">
        <input
          type="text"
          placeholder="Write a comment..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 pro-input px-3.5 py-2 rounded-xl text-xs"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post</span>
        </button>
      </form>
    </div>
  );
};

export default ChatDrawer;
