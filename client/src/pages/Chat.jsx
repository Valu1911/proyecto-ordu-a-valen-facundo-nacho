import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Send,
  Image as ImageIcon,
  Trash2,
  Check,
  CheckCheck,
  ArrowLeft,
  MessageSquare,
  Repeat,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';
import { chatService } from '../services/chatService.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Button } from '../components/ui/Button.jsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx';
import './Chat.css';

export function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, token, openAuthModal } = useAuthStore();
  const { setActiveRoomId } = useChatStore();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io('/', {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO conectado');
    });

    socket.on('chat:new_message', ({ roomId, message }) => {
      if (activeRoom && activeRoom.id === roomId) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      // Update last message in room list
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, lastMessage: message, last_message_at: message.created_at }
            : r
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token, activeRoom]);

  // Fetch Rooms
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await chatService.getRooms();
      setRooms(data.rooms || []);

      // Auto-select room from query params if given
      const targetRoomId = searchParams.get('roomId');
      if (targetRoomId && data.rooms) {
        const found = data.rooms.find((r) => r.id === targetRoomId || r.exchange_id === targetRoomId);
        if (found) setActiveRoom(found);
      } else if (data.rooms && data.rooms.length > 0 && !activeRoom && window.innerWidth > 768) {
        setActiveRoom(data.rooms[0]);
      }
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    fetchRooms();
  }, [isAuthenticated]);

  // Join Room & Load Messages
  useEffect(() => {
    if (!activeRoom) return;

    setActiveRoomId(activeRoom.id);

    if (socketRef.current) {
      socketRef.current.emit('chat:join', { roomId: activeRoom.id });
    }

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const data = await chatService.getMessages(activeRoom.id);
        setMessages(data.messages || []);
        scrollToBottom();
      } catch (err) {
        console.error('Error al cargar mensajes:', err);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('chat:leave', { roomId: activeRoom.id });
      }
    };
  }, [activeRoom]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoom || !socketRef.current) return;

    socketRef.current.emit('chat:message', {
      roomId: activeRoom.id,
      content: messageInput.trim(),
      type: 'text',
    });

    setMessageInput('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;

    setSendingImage(true);
    try {
      const data = await chatService.sendImage(activeRoom.id, file);
      if (socketRef.current && data.url) {
        socketRef.current.emit('chat:message', {
          roomId: activeRoom.id,
          content: 'Foto adjunta',
          imageUrl: data.url,
          type: 'image',
        });
      }
    } catch {
      alert('No se pudo subir la imagen al chat.');
    } finally {
      setSendingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom || !window.confirm('¿Seguro que deseás eliminar esta conversación de tu cuenta?')) return;
    try {
      await chatService.deleteRoom(activeRoom.id);
      setActiveRoom(null);
      fetchRooms();
    } catch {
      alert('Error al eliminar la conversación.');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="container sv-chat-page animate-fade-in">
      <div className="sv-chat-layout">
        {/* Conversations Sidebar */}
        <div className={`sv-chat-sidebar ${activeRoom ? 'mobile-hidden' : ''}`}>
          <div className="sv-chat-sidebar-header">
            <h3>MENSAJES</h3>
            <span className="sv-chat-rooms-count">{rooms.length} chats</span>
          </div>

          {loadingRooms ? (
            <div className="sv-chat-loading-rooms">
              <LoadingSpinner size="sm" messages={['Cargando mensajes...']} />
            </div>
          ) : rooms.length === 0 ? (
            <div className="sv-chat-empty-sidebar">
              <MessageSquare size={36} className="sv-empty-chat-icon" />
              <h4>Bandeja vacía</h4>
              <p>Proponé intercambios en el catálogo para iniciar conversaciones con otros miembros.</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/catalogo')}>
                Explorar Catálogo
              </Button>
            </div>
          ) : (
            <div className="sv-chat-rooms-list">
              {rooms.map((room) => {
                const other = room.user1_id === user.id ? room.user2 : room.user1;
                const isSelected = activeRoom?.id === room.id;
                return (
                  <div
                    key={room.id}
                    className={`sv-room-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setActiveRoom(room)}
                    role="button"
                    tabIndex={0}
                  >
                    <Avatar src={other?.avatar_url} alt={other?.display_name || 'Usuario'} size="md" />
                    <div className="sv-room-info">
                      <div className="sv-room-top">
                        <span className="sv-room-name">{other?.display_name || 'Usuario'}</span>
                        {room.last_message_at && (
                          <span className="sv-room-time">
                            {new Date(room.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="sv-room-last-msg">
                        {room.lastMessage?.content || 'Iniciar conversación...'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Conversation Area */}
        <div className={`sv-chat-window ${!activeRoom ? 'empty-active' : ''}`}>
          {activeRoom ? (
            <>
              {/* Chat Header */}
              <div className="sv-chat-header">
                <button
                  type="button"
                  className="sv-chat-back-mobile"
                  onClick={() => setActiveRoom(null)}
                  aria-label="Volver a lista de mensajes"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="sv-chat-user-header">
                  {(() => {
                    const other = activeRoom.user1_id === user.id ? activeRoom.user2 : activeRoom.user1;
                    return (
                      <>
                        <Avatar src={other?.avatar_url} alt={other?.display_name || 'Usuario'} size="sm" />
                        <div>
                          <h4>{other?.display_name || 'Usuario'}</h4>
                          <span className="sv-chat-user-status">
                            <span className="sv-online-dot" /> Activo en Segunda Vuelta
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="sv-chat-header-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/mis-intercambios')}
                    className="sv-chat-swaps-link"
                  >
                    <Repeat size={14} />
                    <span>Ver Intercambios</span>
                  </Button>
                  <button
                    type="button"
                    className="sv-chat-delete-btn"
                    onClick={handleDeleteRoom}
                    title="Eliminar conversación de mi cuenta"
                    aria-label="Eliminar conversación"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="sv-chat-messages-container">
                <div className="sv-chat-security-notice">
                  <ShieldCheck size={14} />
                  <span>
                    Coordiná el punto de encuentro en lugares públicos seguros y validá la entrega con el código OTP de 8 caracteres.
                  </span>
                </div>

                {loadingMessages ? (
                  <LoadingSpinner size="sm" messages={['Cargando historial de chat...']} />
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={`sv-message-row ${isMe ? 'is-me' : 'is-other'}`}>
                        <div className="sv-message-bubble">
                          {m.image_url && (
                            <img
                              src={m.image_url}
                              alt="Adjunto"
                              className="sv-message-img"
                              onClick={() => window.open(m.image_url, '_blank')}
                            />
                          )}
                          {m.content && <p className="sv-message-content">{m.content}</p>}
                          <div className="sv-message-meta">
                            <span className="sv-message-time">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span className="sv-message-ticks">
                                {m.is_read ? <CheckCheck size={13} className="is-read" /> : <Check size={13} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="sv-chat-input-bar">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  className="sv-chat-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendingImage}
                  title="Adjuntar foto de la prenda"
                  aria-label="Adjuntar foto"
                >
                  <ImageIcon size={20} />
                </button>

                <input
                  type="text"
                  placeholder="Escribí un mensaje para coordinar el intercambio..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="sv-chat-text-input"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!messageInput.trim()}
                  className="sv-chat-send-btn"
                >
                  <Send size={15} />
                </Button>
              </form>
            </>
          ) : (
            <div className="sv-chat-placeholder">
              <div className="sv-placeholder-icon-wrap">
                <MessageSquare size={44} className="sv-placeholder-icon" />
              </div>
              <h3>Tus Mensajes de Intercambio</h3>
              <p>Seleccioná una conversación de la lista para acordar puntos de encuentro y resolver dudas sobre las prendas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}