import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';
import { WeightLog } from '../entities/weightlog.entity';
import { Injectable } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';

@Injectable()
@EventSubscriber()
export class WeightLogSubscriber implements EntitySubscriberInterface<WeightLog> {
    constructor(private readonly settingsService: SettingsService) {}

    listenTo() {
        return WeightLog;
    }

    async afterInsert(event: InsertEvent<WeightLog>) {
        await this.settingsService.refreshStartWeight();
    }

    async afterUpdate(event: UpdateEvent<WeightLog>) {
        await this.settingsService.refreshStartWeight();
    }

    async afterRemove(event: RemoveEvent<WeightLog>) {
        await this.settingsService.refreshStartWeight();
    }
}