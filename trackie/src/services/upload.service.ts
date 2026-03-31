import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    constructor(private configService: ConfigService) { }

    async savePhotos(files: Express.Multer.File[]): Promise<string[]> {
        const uploadDir = this.configService.get('UPLOAD_DIR', './uploads/stats');

        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const savedPhotos: string[] = [];

        for (const file of files) {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${uuidv4()}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            // Guardar archivo
            fs.writeFileSync(filePath, file.buffer);

            const fileUrl = `/uploads/stats/${fileName}`;
            savedPhotos.push(fileUrl);
        }

        return savedPhotos;
    }

    async deletePhoto(photoUrl: string): Promise<void> {
        try {
            const fileName = path.basename(photoUrl);
            const uploadDir = this.configService.get('UPLOAD_DIR', './uploads/stats');
            const filePath = path.join(uploadDir, fileName);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    }

    async deleteMultiplePhotos(photoUrls: string[]): Promise<void> {
        for (const photoUrl of photoUrls) {
            await this.deletePhoto(photoUrl);
        }
    }
}