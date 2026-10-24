import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Exchange = sequelize.define('Exchange', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  requester_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  product_requested_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'products', key: 'id' },
  },
  product_offered_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'products', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM(
      'pending', 'accepted', 'formalized', 'completed',
      'rejected', 'cancelled', 'expired', 'disputed'
    ),
    defaultValue: 'pending',
  },
  exchange_code: {
    type: DataTypes.STRING(8),
    allowNull: true,
    unique: true,
  },
  requester_confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  owner_confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  formalized_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'exchanges',
  indexes: [
    { fields: ['requester_id'] },
    { fields: ['owner_id'] },
    { fields: ['status'] },
    { fields: ['exchange_code'], unique: true },
    { fields: ['expires_at'] },
  ],
});

export default Exchange;
