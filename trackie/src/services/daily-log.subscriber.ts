import { EventSubscriber, EntitySubscriberInterface, UpdateEvent, InsertEvent } from 'typeorm';
import { DailyLog } from '../entities/dailylog.entity';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { CutPhaseService } from '../services/cutphase.service';

@EventSubscriber()
@Injectable()
export class DailyLogSubscriber implements EntitySubscriberInterface<DailyLog> {
    constructor(
        @Inject(forwardRef(() => CutPhaseService))
        private readonly cutPhaseService: CutPhaseService
    ) {}

    listenTo() {
        return DailyLog;
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
            console.error('Error syncing daily log with cut phase:', error);
        }
    }
}