import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';

// Entities
import { DailyLog } from './entities/dailylog.entity';
import { WeightLog } from './entities/weightlog.entity';
import { Settings } from './entities/setting.entity';

// Services
import { DailyLogService } from './services/dailylog.service';
import { WeightLogService } from './services/weightlog.service';
import { SettingsService } from './services/settings.service';
import { UploadService } from './services/upload.service';

// Controllers
import { DailyLogController } from './controllers/dailylog.controller';
import { WeightLogController } from './controllers/weightlog.controller';
import { SettingsController } from './controllers/settings.controller';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuración de TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [DailyLog, WeightLog, Settings],
      synchronize: true,
      ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false,
    }),

    TypeOrmModule.forFeature([DailyLog, WeightLog, Settings]),

    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB por archivo
      },
    }),
  ],
  controllers: [DailyLogController, WeightLogController, SettingsController],
  providers: [DailyLogService, WeightLogService, SettingsService, UploadService],
})
export class AppModule { }