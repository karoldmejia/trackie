import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from '../entities/setting.entity';
import { WeightLog } from '../entities/weightlog.entity';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from '../dtos/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepo: Repository<Settings>,
    @InjectRepository(WeightLog)
    private readonly weightLogRepo: Repository<WeightLog>, // Inyecta WeightLog
  ) {}

  async getSettings(): Promise<Settings> {
    let settings = await this.settingsRepo.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepo.create({});
      await this.settingsRepo.save(settings);
    }
    
    await this.updateStartWeight(settings);
    
    return settings;
  }

  private async updateStartWeight(settings: Settings): Promise<void> {
    const maxWeight = await this.weightLogRepo
      .createQueryBuilder('weight_logs')
      .select('MAX(weight)', 'maxWeight')
      .getRawOne();

    if (maxWeight && maxWeight.maxWeight !== null) {
      const maxWeightValue = parseFloat(maxWeight.maxWeight);
      
      // Solo actualizar si hay un cambio y si el nuevo peso es mayor
      if (maxWeightValue > settings.startWeight) {
        settings.startWeight = maxWeightValue;
        await this.settingsRepo.save(settings);
        this.logger.log(`StartWeight actualizado a: ${maxWeightValue}kg`);
      }
    }
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    let settings = await this.getSettings();
    
    if (dto.weekStartDay !== undefined) {
      settings.weekStartDay = dto.weekStartDay;
    }
    if (dto.calorieLimit !== undefined) {
      settings.calorieLimit = dto.calorieLimit;
    }
    if (dto.stepsLimit !== undefined) {
      settings.stepsLimit = dto.stepsLimit;
    }
    if (dto.targetWeight !== undefined) {
      settings.targetWeight = dto.targetWeight;
    }
        
    const result = await this.settingsRepo.save(settings);
    return result;
  }

  async refreshStartWeight(): Promise<number> {
    const settings = await this.getSettings();
    await this.updateStartWeight(settings);
    return settings.startWeight;
  }
}