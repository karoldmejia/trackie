import { EventSubscriber, EntitySubscriberInterface, UpdateEvent, InsertEvent } from 'typeorm';
import { DailyLog } from '../entities/dailylog.entity';
import { Injectable, forwardRef, Inject, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CutPhaseService } from '../services/cutphase.service';

@EventSubscriber()
@Injectable()
export class DailyLogSubscriber implements EntitySubscriberInterface<DailyLog>, OnApplicationBootstrap {
    private readonly logger = new Logger(DailyLogSubscriber.name);
    private hasSyncedExisting = false;

    constructor(
        @Inject(forwardRef(() => CutPhaseService))
        private readonly cutPhaseService: CutPhaseService
    ) {}

    listenTo() {
        return DailyLog;
    }

    async onApplicationBootstrap() {
        // Sincronizar solo una vez al iniciar
        if (!this.hasSyncedExisting) {
            this.logger.log('Checking for existing daily logs to sync...');
            await this.syncAllExistingDays();
            this.hasSyncedExisting = true;
        }
    }

    async afterInsert(event: InsertEvent<DailyLog>) {
        await this.syncWithCutPhase(event.entity);
    }

    async afterUpdate(event: UpdateEvent<DailyLog>) {
        if (event.entity) {
            await this.syncWithCutPhase(event.entity as DailyLog);
        }
    }

    private async syncWithCutPhase(dailyLog: DailyLog): Promise<void> {
        try {
            const activePhase = await this.cutPhaseService.findActive();
            if (!activePhase) return;
            if (dailyLog.date < activePhase.startDate || dailyLog.date > activePhase.endDate) return;
            await this.cutPhaseService.updateDayCompliance(activePhase.id, dailyLog.date);
        } catch (error) {
            this.logger.error(`Error syncing daily log ${dailyLog.date}: ${error}`);
        }
    }

    private async syncAllExistingDays(): Promise<void> {
        try {
            const activePhase = await this.cutPhaseService.findActive();
            if (!activePhase) {
                this.logger.log('No active cut phase found, skipping sync');
                return;
            }

            // Verificar si hay días sin sincronizar
            const days = await this.cutPhaseService.getCutDays(activePhase.id);
            const syncedCount = await this.cutPhaseService.syncAllExistingDays(activePhase.id);
            
            if (syncedCount > 0) {
                this.logger.log(`Synced ${syncedCount} existing days for phase ${activePhase.id}`);
            } else {
                this.logger.log('No existing days needed syncing');
            }
        } catch (error) {
            this.logger.error(`Error syncing all existing days: ${error}`);
        }
    }
}