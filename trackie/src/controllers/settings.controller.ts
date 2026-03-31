import { Body, Controller, Get, Put } from "@nestjs/common";
import { Settings } from "../entities/setting.entity";
import { SettingsService } from "../services/settings.service";
import { UpdateSettingsDto } from "../dtos/settings.dto";


@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    // Obtener configuración actual
    @Get()
    async getSettings(): Promise<Settings> {
        return this.settingsService.getSettings();
    }

    // Actualizar configuración
    @Put()
    async update(@Body() dto: UpdateSettingsDto): Promise<Settings> {
        return this.settingsService.update(dto);
    }
}