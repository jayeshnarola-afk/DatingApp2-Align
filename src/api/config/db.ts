import { env } from "../../infrastructure/env";
import { logger } from "../../api/lib/logger";
import { DataSource } from "typeorm";
import { runSeeders } from "typeorm-extension";
import path from "path";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: "postgresql://datingapp2align_user:lujwhuUJzVaHP0k1WZu8JEj5FpVRRllE@dpg-d4iq0vngi27c739poe8g-a.oregon-postgres.render.com/datingapp2align",
  synchronize: false,
  // host: env.DB_HOST,
  // port: 5432,
  // username: env.DB_USER,
  // password: env.DB_PASS,
  // database: env.DB_NAME,
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
    ssl: {
      rejectUnauthorized: false,  // Render માટે જરૂરી
    },
  },
});

AppDataSource.initialize()
  .then(async () => {
    console.log("Connected to PostgreSQL Database");
  })
  .catch((error: any) => console.log(error));
