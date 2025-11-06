import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ProjectsModule } from './projects/projects.module';
import { SchedulesModule } from './schedules/schedules.module';
import { PostsModule } from './posts/posts.module';
import { ChatModule } from './chat/chat.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000, // 1 minute window
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10), // 100 requests per minute (more reasonable default)
      },
      {
        name: 'medium',
        ttl: 10 * 60 * 1000, // 10 minutes
        limit: 1000, // 1000 requests per 10 minutes
      },
      {
        name: 'long',
        ttl: 60 * 60 * 1000, // 1 hour
        limit: 5000, // 5000 requests per hour
      },
    ]),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ProjectsModule,
    SchedulesModule,
    PostsModule,
    ChatModule,
    UploadsModule,
    AdminModule,
  ],
  providers: [
    // Enable throttler guard for rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

