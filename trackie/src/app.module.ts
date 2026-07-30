import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';

import { DailyLog } from './entities/dailylog.entity';
import { WeightLog } from './entities/weightlog.entity';
import { Settings } from './entities/setting.entity';
import { DayPlan } from './entities/day-plan.entity';
import { PlannedMeal } from './entities/planned-meal.entity';
import { Dish } from './entities/dish.entity';

import { DailyLogService } from './services/dailylog.service';
import { WeightLogService } from './services/weightlog.service';
import { SettingsService } from './services/settings.service';
import { UploadService } from './services/upload.service';
import { MealPlannerService } from './services/meal-planner.service';
import { CloudinaryService } from './services/cloudinary.service';

import { DailyLogController } from './controllers/dailylog.controller';
import { WeightLogController } from './controllers/weightlog.controller';
import { SettingsController } from './controllers/settings.controller';
import { MealPlannerController } from './controllers/meal-planner.controller';
import { ShoppingItem } from './entities/shopping-item.entity';
import { ShoppingList } from './entities/shopping-list.entity';
import { ShoppingListController } from './controllers/shopping-list.controller';
import { ShoppingListService } from './services/shopping-list.service';
import { CutPhase } from './entities/cutphase.entity';
import { CutPhaseDay } from './entities/cutphaseday.entity';
import { CutPhaseController } from './controllers/cutphase.controller';
import { CutPhaseService } from './services/cutphase.service';
import { DailyLogSubscriber } from './services/daily-log.subscriber';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [DailyLog, WeightLog, Settings, DayPlan, PlannedMeal, Dish, ShoppingItem, ShoppingList, CutPhase, CutPhaseDay],
      synchronize: true,
      ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false,
    }),

    TypeOrmModule.forFeature([DailyLog, WeightLog, Settings, DayPlan, PlannedMeal, Dish, ShoppingItem, ShoppingList, CutPhase, CutPhaseDay]),

    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB por archivo
      },
    }),
  ],
  controllers: [
    DailyLogController,
    WeightLogController,
    SettingsController,
    MealPlannerController,
    ShoppingListController,
    CutPhaseController
  ],
  providers: [
    DailyLogService,
    WeightLogService,
    SettingsService,
    UploadService,
    CloudinaryService,
    MealPlannerService,
    ShoppingListService,
    CutPhaseService,
    DailyLogSubscriber,

  ],
})
export class AppModule { }