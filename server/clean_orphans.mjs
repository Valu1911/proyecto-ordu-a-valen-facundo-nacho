import { sequelize, ChatRoom, Message, Exchange, Review, Product } from './src/models/index.js';
import { seedDatabase } from './src/seeders/seedData.js';

async function cleanup() {
  await sequelize.authenticate();
  console.log('Connected to DB.');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
  await Message.destroy({ where: {} });
  await ChatRoom.destroy({ where: {} });
  await Review.destroy({ where: {} });
  await Exchange.destroy({ where: {} });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('Orphaned rows cleaned.');
  await seedDatabase(false);
  console.log('Database synced.');
  process.exit(0);
}

cleanup().catch(e => {
  console.error(e);
  process.exit(1);
});
