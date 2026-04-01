import { Injectable } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class UploadService {
    constructor(private cloudinaryService: CloudinaryService) {}

    async savePhotos(files: Express.Multer.File[]): Promise<string[]> {
        return this.cloudinaryService.uploadMultipleImages(files);
    }

    async savePhotosFromBase64(base64Strings: string[]): Promise<string[]> {
        const files: Express.Multer.File[] = [];
        
        for (const base64String of base64Strings) {
            const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
            if (matches) {
                const buffer = Buffer.from(matches[2], 'base64');
                files.push({
                    buffer,
                    originalname: `photo.${matches[1]}`,
                    mimetype: `image/${matches[1]}`,
                } as Express.Multer.File);
            }
        }
        
        return this.cloudinaryService.uploadMultipleImages(files);
    }

    async deletePhoto(photoUrl: string): Promise<void> {
        if (photoUrl.includes('cloudinary.com')) {
            await this.cloudinaryService.deleteImage(photoUrl);
        }
    }

    async deleteMultiplePhotos(photoUrls: string[]): Promise<void> {
        for (const photoUrl of photoUrls) {
            await this.deletePhoto(photoUrl);
        }
    }
}