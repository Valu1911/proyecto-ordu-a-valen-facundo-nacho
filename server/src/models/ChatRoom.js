import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  exchange_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'exchanges', key: 'id' },
  },
  user1_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  user2_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  user1_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  user2_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'chat_rooms',
  updatedAt: false,
  indexes: [
    { fields: ['exchange_id'], unique: true },
    { fields: ['user1_id'] },
    { fields: ['user2_id'] },
    { fields: ['last_message_at'] },
  ],
});

export default ChatRoom;
