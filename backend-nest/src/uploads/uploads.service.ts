import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as sharp from 'sharp';

@Injectable()
export class UploadsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadFile(file: Express.Multer.File, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Compress and resize image
    const processedBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `${userId}/${timestamp}-${randomString}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, processedBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filename,
    };
  }
}

