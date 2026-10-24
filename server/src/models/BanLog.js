import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BanLog = sequelize.define('BanLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  action: {
    type: DataTypes.ENUM('ban_temp', 'ban_permanent', 'unban'),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  duration_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'ban_logs',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['admin_id'] },
    { fields: ['created_at'] },
  ],
});

export default BanLog;
