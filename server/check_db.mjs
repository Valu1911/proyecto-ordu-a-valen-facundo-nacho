import sequelize from './src/config/database.js';

try {
  await sequelize.authenticate();
  console.log("DB_OK");
  const [results] = await sequelize.query("SHOW TABLES;");
  console.log("Tables:", results);
  process.exit(0);
} catch (error) {
  console.error("DB_ERROR:", error.message);
  process.exit(1);
}
