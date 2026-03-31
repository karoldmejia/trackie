import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from '../entities/setting.entity';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from '../dtos/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepo: Repository<Settings>,
  ) {}

  async getSettings(): Promise<Settings> {
    let settings = await this.settingsRepo.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepo.create({});
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    let settings = await this.getSettings();
    
    // Actualizar solo los campos que vienen en el DTO
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
}