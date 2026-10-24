import jwt from 'jsonwebtoken';
import { User, ChatRoom, Message } from '../models/index.js';

export function setupSocketHandlers(io) {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Autenticacion requerida'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'display_name', 'avatar_url'],
      });

      if (!user) {
        return next(new Error('Usuario no encontrado'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Token invalido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.display_name} (${socket.userId})`);

    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Join a chat room
    socket.on('chat:join', async ({ roomId }) => {
      try {
        const room = await ChatRoom.findByPk(roomId);
        if (!room) return;

        // Verify user is part of this room
        if (room.user1_id !== socket.userId && room.user2_id !== socket.userId) {
          return socket.emit('error', { message: 'No autorizado' });
        }

        socket.join(`room:${roomId}`);
        console.log(`${socket.user.display_name} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
      }
    });

    // Leave a chat room
    socket.on('chat:leave', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
    });

    // Send a message
    socket.on('chat:message', async ({ roomId, content, type = 'text', imageUrl = null }) => {
      try {
        const room = await ChatRoom.findByPk(roomId);
        if (!room) return;

        if (room.user1_id !== socket.userId && room.user2_id !== socket.userId) {
          return;
        }

        const message = await Message.create({
          room_id: roomId,
          sender_id: socket.userId,
          content,
          image_url: imageUrl,
          message_type: type,
        });

        await room.update({ last_message_at: new Date() });

        const messageData = {
          ...message.toJSON(),
          sender: {
            id: socket.user.id,
            display_name: socket.user.display_name,
            avatar_url: socket.user.avatar_url,
          },
        };

        // Emit to all users in the room
        io.to(`room:${roomId}`).emit('chat:new_message', messageData);

        // Notify the other user if they're not in the room
        const otherUserId = room.user1_id === socket.userId ? room.user2_id : room.user1_id;
        io.to(`user:${otherUserId}`).emit('notification:new', {
          type: 'message',
          data: {
            roomId,
            senderName: socket.user.display_name,
            preview: type === 'text' ? content.substring(0, 50) : 'Envio una imagen',
          },
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Typing indicator
    socket.on('chat:typing', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('chat:user_typing', {
        roomId,
        userId: socket.userId,
        displayName: socket.user.display_name,
      });
    });

    socket.on('chat:stop_typing', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('chat:user_stop_typing', {
        roomId,
        userId: socket.userId,
      });
    });

    // Mark messages as read
    socket.on('chat:read', async ({ roomId, messageId }) => {
      try {
        await Message.update(
          { is_read: true },
          {
            where: {
              room_id: roomId,
              sender_id: { [Symbol.for('ne')]: socket.userId },
              is_read: false,
            },
          }
        );

        socket.to(`room:${roomId}`).emit('chat:message_read', {
          roomId,
          readBy: socket.userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.display_name}`);
    });
  });
}
