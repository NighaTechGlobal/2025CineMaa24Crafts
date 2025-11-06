import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as sharp from 'sharp';

@Injectable()
export class UploadsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadFile(file: Express.Multer.File, userId: string) {
    // Compress and resize image
    const processedBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Return the binary data as base64 for storage in database
    const base64Image = processedBuffer.toString('base64');

    return {
      success: true,
      image: base64Image,
      buffer: processedBuffer,
    };
  }
}

