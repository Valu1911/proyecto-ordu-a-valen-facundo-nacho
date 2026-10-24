import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  display_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: [2, 100] },
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  location_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  location_city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  location_province: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  is_banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ban_type: {
    type: DataTypes.ENUM('temporary', 'permanent'),
    allowNull: true,
  },
  ban_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ban_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rating_avg: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0,
  },
  rating_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  strikes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refresh_token: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['google_id'], unique: true },
    { fields: ['role'] },
    { fields: ['is_banned'] },
    { fields: ['location_lat', 'location_lng'] },
    { fields: ['rating_avg'] },
  ],
});

export default User;
