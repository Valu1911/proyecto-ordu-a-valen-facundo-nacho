import sequelize from '../config/database.js';
import User from './User.js';
import Product from './Product.js';
import Exchange from './Exchange.js';
import ChatRoom from './ChatRoom.js';
import Message from './Message.js';
import Review from './Review.js';
import BanLog from './BanLog.js';
import Report from './Report.js';

// ==========================================
// Associations
// ==========================================

// User -> Products (one-to-many)
User.hasMany(Product, { foreignKey: 'user_id', as: 'products' });
Product.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// User -> Exchanges (as requester)
User.hasMany(Exchange, { foreignKey: 'requester_id', as: 'sentExchanges' });
Exchange.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });

// User -> Exchanges (as owner)
User.hasMany(Exchange, { foreignKey: 'owner_id', as: 'receivedExchanges' });
Exchange.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Exchange -> Products
Exchange.belongsTo(Product, { foreignKey: 'product_requested_id', as: 'productRequested' });
Exchange.belongsTo(Product, { foreignKey: 'product_offered_id', as: 'productOffered' });

// Exchange -> ChatRoom (one-to-one)
Exchange.hasOne(ChatRoom, { foreignKey: 'exchange_id', as: 'chatRoom' });
ChatRoom.belongsTo(Exchange, { foreignKey: 'exchange_id', as: 'exchange' });

// ChatRoom -> Users
ChatRoom.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
ChatRoom.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

// ChatRoom -> Messages (one-to-many)
ChatRoom.hasMany(Message, { foreignKey: 'room_id', as: 'messages' });
Message.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'room' });

// Message -> User (sender)
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Reviews
User.hasMany(Review, { foreignKey: 'reviewed_id', as: 'receivedReviews' });
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'givenReviews' });
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'reviewed_id', as: 'reviewed' });
Review.belongsTo(Exchange, { foreignKey: 'exchange_id', as: 'exchange' });

// BanLog
BanLog.belongsTo(User, { foreignKey: 'user_id', as: 'bannedUser' });
BanLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

// Reports
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reported_user_id', as: 'reportedUser' });
Report.belongsTo(Product, { foreignKey: 'reported_product_id', as: 'reportedProduct' });

export {
  sequelize,
  User,
  Product,
  Exchange,
  ChatRoom,
  Message,
  Review,
  BanLog,
  Report,
};
