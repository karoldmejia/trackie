import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(buffer: Buffer, originalname: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'trackie/weights',
                    public_id: `${Date.now()}-${originalname.split('.')[0]}`,
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve(result.secure_url);
                    } else {
                        reject(new Error('No result from Cloudinary'));
                    }
                }
            );
            uploadStream.end(buffer);
        });
    }

    async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
        const urls: string[] = [];
        for (const file of files) {
            const url = await this.uploadImage(file.buffer, file.originalname);
            urls.push(url);
        }
        return urls;
    }

    async deleteImage(url: string): Promise<void> {
        // Extraer public_id de la URL
        // Formato: https://res.cloudinary.com/cloud_name/image/upload/v123456/trackie/weights/filename.jpg
        const parts = url.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const publicId = `trackie/weights/${filename}`;
        
        await cloudinary.uploader.destroy(publicId);
    }
}