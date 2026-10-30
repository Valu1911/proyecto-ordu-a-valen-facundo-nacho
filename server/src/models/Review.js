import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reviewer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  reviewed_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  exchange_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'exchanges', key: 'id' },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { len: [10, 1000] },
  },
}, {
  tableName: 'reviews',
  updatedAt: false,
  indexes: [
    { fields: ['reviewed_id'] },
    { fields: ['reviewer_id'] },
    { fields: ['exchange_id'] },
    { fields: ['reviewer_id', 'exchange_id'], unique: true },
    { fields: ['rating'] },
  ],
});

export default Review;
