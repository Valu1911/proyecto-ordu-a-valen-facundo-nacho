import { sequelize } from './src/models/index.js';
import { seedDatabase } from './src/seeders/seedData.js';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    await seedDatabase(true);
    console.log('Database re-seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error re-seeding:', err);
    process.exit(1);
  }
}

main();
