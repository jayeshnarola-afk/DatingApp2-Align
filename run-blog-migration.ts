import { AppDataSource } from "./src/api/config/db";

async function runMigration() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected!");

    // Run the migration
    await AppDataSource.runMigrations();
    console.log("✅ Migration completed successfully!");
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
