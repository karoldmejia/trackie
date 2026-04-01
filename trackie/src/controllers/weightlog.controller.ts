import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseInterceptors, UploadedFiles, Logger } from '@nestjs/common';
import { WeightLogService, WeightStats, WeightTrend } from '../services/weightlog.service';
import { WeightLog } from '../entities/weightlog.entity';
import { CreateWeightLogDto, UpdateWeightLogDto } from '../dtos/weightlog.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('weight-logs')
export class WeightLogController {
    private readonly logger = new Logger(WeightLogController.name);

    constructor(private readonly weightLogService: WeightLogService) { }

    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'photos', maxCount: 10 }
    ]))
    async create(
        @Body() dto: CreateWeightLogDto,
        @UploadedFiles() files: { photos?: Express.Multer.File[] }
    ): Promise<WeightLog> {
        try {
            const result = await this.weightLogService.create(dto, files?.photos);
            return result;
        } catch (error) {
            this.logger.error(`Error al crear registro: ${error.message}`);
            throw error;
        }
    }

@Put('date')
@UseInterceptors(FileFieldsInterceptor([{ name: 'photos', maxCount: 10 }]))
async upsertByDate(
    @Body() body: any,
    @UploadedFiles() files: { photos?: Express.Multer.File[] }
): Promise<WeightLog> {
    const dto: CreateWeightLogDto = {
        date: body.date,
        weight: parseFloat(body.weight),
        bodyfat: body.bodyfat ? parseFloat(body.bodyfat) : undefined,
        skeletalMuscle: body.skeletalMuscle ? parseFloat(body.skeletalMuscle) : undefined,
        waist: body.waist ? parseFloat(body.waist) : undefined,
    };

    let photosToDelete: string[] = [];
    if (body.photosToDelete) {
        photosToDelete = typeof body.photosToDelete === 'string'
            ? JSON.parse(body.photosToDelete)
            : body.photosToDelete;
    }

    // Procesar fotos: combinar archivos normales con posibles strings base64
    let allPhotos: Express.Multer.File[] = [...(files?.photos || [])];

    if (body.photos && Array.isArray(body.photos)) {
        for (const photo of body.photos) {
            if (typeof photo === 'string' && photo.startsWith('data:image')) {
                // Extraer el tipo de imagen de la data URL
                const matches = photo.match(/^data:image\/(\w+);base64,/);
                const mimeType = matches ? matches[1] : 'jpeg';
                const extension = mimeType === 'jpeg' ? 'jpg' : mimeType;
                
                const base64Data = photo.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                
                this.logger.log(`📸 Procesando base64: tipo=${mimeType}, tamaño=${buffer.length} bytes`);
                
                allPhotos.push({
                    originalname: `photo_${Date.now()}.${extension}`,
                    buffer: buffer,
                    mimetype: `image/${mimeType}`,
                    size: buffer.length,
                } as Express.Multer.File);
            }
        }
    }

    this.logger.log(`📸 Total fotos a procesar: ${allPhotos.length}`);

    const result = await this.weightLogService.upsert(dto, allPhotos, photosToDelete);
    return result;
}

    @Put(':id')
    @UseInterceptors(FileFieldsInterceptor([{ name: 'photos', maxCount: 10 }]))
    async update(@Param('id') id: string, @Body() dto: UpdateWeightLogDto, @UploadedFiles() files: { photos?: Express.Multer.File[] }): Promise<WeightLog> {
        let photosToDelete: string[] = [];
        if (dto.photosToDelete) {
            photosToDelete = typeof dto.photosToDelete === 'string'
                ? JSON.parse(dto.photosToDelete)
                : dto.photosToDelete;
        }

        return this.weightLogService.update(id, dto, files?.photos, photosToDelete);
    }

    @Get()
    async findAll(): Promise<WeightLog[]> {
        return this.weightLogService.findAll();
    }

    @Get('range')
    async findByDateRange(
        @Query('start') start: string,
        @Query('end') end: string
    ): Promise<WeightLog[]> {
        return this.weightLogService.findByDateRange(start, end);
    }

    @Get('date/:date')
    async findByDate(@Param('date') date: string): Promise<WeightLog | null> {
        return this.weightLogService.findByDate(date);
    }

    @Get('last')
    async findLast(): Promise<WeightLog | null> {
        return this.weightLogService.findLast();
    }

    @Get('stats')
    async getStats(
        @Query('start') start: string,
        @Query('end') end: string
    ): Promise<WeightStats> {
        return this.weightLogService.getStats(start, end);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
        await this.weightLogService.remove(id);
        return { deleted: true };
    }

    @Delete('date/:date')
    async removeByDate(@Param('date') date: string): Promise<{ deleted: boolean }> {
        await this.weightLogService.removeByDate(date);
        return { deleted: true };
    }
}