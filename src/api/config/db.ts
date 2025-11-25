import { env } from "../../infrastructure/env";
import { logger } from "../../api/lib/logger";
import { DataSource } from "typeorm";
import { runSeeders } from "typeorm-extension";
import path from "path";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: 5432,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  logging: false,
  entities: [
    path.join(__dirname, "../", `domain/entities/*{.ts,.js}`),
    path.join(__dirname, "../", `domain/entities/v2/*{.ts,.js}`),
    path.join(__dirname, "../", `domain/entities/admin/*{.ts,.js}`),
  ],
  migrations: [
    path.join(__dirname, "../", `domain/migration/*{.ts,.js}`),
  ],

  // IMPORTANT: No SSL for local PostgreSQL
  extra: {
    ssl: false,
  },
});

AppDataSource.initialize()
  .then(async () => {
    console.log("Connected to PostgreSQL Database");
  })
  .catch((error: any) => console.log(error));
