import React, { useEffect, useState } from 'react';
import api from '../services/api';
import supabase from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Send, User, Trash2, ShieldAlert, Sparkles, MessageSquareX } from 'lucide-react';

const WorkplaceMessagesView = () => {
  const { user, hasPermission } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const canSendMessage = user?.role === 'admin' || hasPermission('send_messages');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchDirectMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Realtime WebSocket Subscription for instant direct messaging
  useEffect(() => {
    if (!selectedUser || !user) return;

    const channel = supabase
      .channel(`direct_messages_${user.id}_${selectedUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workplace_messages',
        },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedUser.id) ||
            (newMsg.sender_id === selectedUser.id && newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'workplace_messages',
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
  }, [selectedUser, user]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      const filtered = (res.data.employees || []).filter((e) => e.id !== user.id);
      setEmployees(filtered);
      if (filtered.length > 0) setSelectedUser(filtered[0]);
    } catch (err) {
      console.error('Failed to load employee list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectMessages = async (otherUserId) => {
    try {
      const res = await api.get(`/messages/direct/${otherUserId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    if (!canSendMessage) {
      toast.error('You do not have permission to send messages.');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/messages', {
        receiver_id: selectedUser.id,
        content: newMessage,
      });

      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
      toast.success('Message sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message permanently from database?')) return;
    try {
      await api.delete(`/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success('Message deleted from database.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete message.');
    }
  };

  const handleClearConversation = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Delete ALL messages in conversation with ${selectedUser.name} directly from database?`)) return;

    try {
      await api.delete(`/messages/conversation/${selectedUser.id}`);
      setMessages([]);
      toast.success('All conversation messages deleted from database.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to clear conversation.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pro-card rounded-2xl h-[calc(100vh-8rem)] flex overflow-hidden">
      {/* Left Column: Employee Directory */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/60 p-4 space-y-4 flex flex-col">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Directory</h3>
        <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
          {employees.map((emp) => {
            const isSelected = selectedUser?.id === emp.id;
            return (
              <button
                key={emp.id}
                onClick={() => setSelectedUser(emp)}
                className={`w-full p-3 rounded-xl text-left flex items-center space-x-3 transition ${
                  isSelected ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-200/60 text-slate-700 bg-white border border-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>
                  {emp.name ? emp.name.substring(0, 2).toUpperCase() : 'EM'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{emp.name}</div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {emp.position?.title || emp.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Chat Conversation Thread */}
      <div className="flex-1 flex flex-col justify-between bg-white">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                  {selectedUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{selectedUser.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{selectedUser.email}</p>
                </div>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={handleClearConversation}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-rose-200 transition"
                  title="Delete all messages from database"
                >
                  <MessageSquareX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear Chat</span>
                </button>
              )}
            </div>

            {/* Permission Restriction Notice */}
            {!canSendMessage && (
              <div className="m-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Messaging Access Restricted:</strong> By default, messaging permissions are disabled for employees. Contact your admin to request direct messaging access.
                </span>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-medium">
                  No messages yet. {canSendMessage ? 'Send a message to start the conversation.' : 'Conversation history is empty.'}
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  const canDelete = user?.role === 'admin' || isMe;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      <div
                        className={`max-w-xs sm:max-w-md p-3 rounded-2xl text-xs shadow-2xs relative ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-none font-medium'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="leading-relaxed pr-5">{msg.content}</p>

                        <div className="flex items-center justify-between text-[9px] mt-1 pt-1 border-t border-white/20">
                          <span className={`${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition ${
                                isMe ? 'text-blue-200 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title="Delete message from database"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            {canSendMessage ? (
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex gap-2 bg-slate-50">
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 pro-input px-4 py-2.5 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            ) : (
              <div className="p-3 border-t border-slate-200 bg-slate-100 text-slate-500 text-center text-xs font-semibold">
                You need messaging permissions to send direct messages.
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
            Select an employee to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkplaceMessagesView;
