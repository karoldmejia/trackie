// services/upload.service.ts
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

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const savedPhotos: string[] = [];

        for (const file of files) {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${uuidv4()}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, file.buffer);
            const fileUrl = `/uploads/stats/${fileName}`;
            savedPhotos.push(fileUrl);
        }

        return savedPhotos;
    }

    async savePhotosFromBase64(base64Strings: string[]): Promise<string[]> {
        const uploadDir = this.configService.get('UPLOAD_DIR', './uploads/stats');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const savedPhotos: string[] = [];

        for (const base64String of base64Strings) {
            try {
                // Extraer el tipo de imagen y los datos base64
                const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
                
                if (!matches) {
                    console.error('Formato base64 inválido');
                    continue;
                }

                const extension = matches[1]; // jpeg, png, etc.
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');
                
                const fileName = `${uuidv4()}.${extension}`;
                const filePath = path.join(uploadDir, fileName);
                
                fs.writeFileSync(filePath, buffer);
                const fileUrl = `/uploads/stats/${fileName}`;
                savedPhotos.push(fileUrl);
                
            } catch (error) {
                console.error('Error guardando foto desde base64:', error);
            }
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