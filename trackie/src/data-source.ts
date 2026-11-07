import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  // Por defecto se fuerza SSL (producción). Para Postgres local: DATABASE_SSL=false npm run migration:run
  ssl: process.env.DATABASE_SSL === 'false' ? false : {
    rejectUnauthorized: false
  }
});
