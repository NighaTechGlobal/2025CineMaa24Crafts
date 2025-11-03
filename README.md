# 24Krafts - Production-Grade Chat & App Platform

A complete, production-ready platform for the Tamil film industry connecting artists and recruiters, built with NestJS backend, Supabase (PostgreSQL + Realtime), and React Native (Expo 54).

## 🎯 Project Overview

24Krafts is an end-to-end platform featuring:
- **Real-time chat** with WebSockets (Supabase Realtime)
- **Role-based access** (Artists, Recruiters, Admins)
- **Project & schedule management**
- **Social feed** with posts, comments, and likes
- **Member discovery** and networking
- **Cursor-based pagination** for optimal performance
- **Full TypeScript** backend and frontend

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the Project](#running-the-project)
- [Database Migrations](#database-migrations)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [API Endpoints](#api-endpoints)
- [Security & RLS](#security--rls)
- [Known Issues & Caveats](#known-issues--caveats)
- [Production Deployment](#production-deployment)

## 🏗️ Architecture

```
┌──────────────┐
│  React Native│
│   (Expo 54)  │ ←──────→ Supabase Realtime (WebSockets)
│   Frontend   │              ↓
└───────┬──────┘         PostgreSQL
        │                (with RLS)
        │ REST API
        ↓
┌──────────────┐
│   NestJS     │
│   Backend    │ ←──────→ Supabase Admin Client
└──────────────┘
```

### Data Flow

1. **Authentication**: Phone + OTP → Supabase Auth → JWT tokens
2. **Real-time Messages**: Client inserts → Postgres trigger → Supabase broadcasts → All subscribed clients receive
3. **API Operations**: Client → NestJS (validation, business logic) → Supabase (server-side insert) → Realtime broadcast
4. **Presence/Typing**: Heartbeat updates to `presence` table → Realtime subscriptions

## 🛠️ Tech Stack

### Backend
- **NestJS** 10.x (Node 18 LTS)
- **Supabase** 2.39+ (PostgreSQL + Realtime)
- **TypeScript** 5.3+
- **class-validator** & **class-transformer** for DTOs
- **Morgan** for HTTP logging
- **Sharp** for image processing
- **Jest** for testing

### Frontend
- **Expo SDK** 54 (managed workflow)
- **React Native** 0.76.5
- **React Navigation** 6.x
- **@supabase/supabase-js** for realtime
- **react-native-gifted-chat** for chat UI
- **react-native-reanimated** 3.16 for animations
- **Axios** for REST calls
- **TypeScript** 5.3+

### Database
- **PostgreSQL** (via Supabase)
- Row-Level Security (RLS) policies
- Realtime subscriptions
- UUID primary keys
- TIMESTAMPTZ for all timestamps

## ✅ Prerequisites

- **Node.js** 18+ LTS
- **npm** or **yarn**
- **Supabase** account and project
- **Expo CLI** (optional, will be installed locally)
- **Git**

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd test
```

### 2. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and keys

#### Run Migrations

```bash
# Using Supabase CLI (recommended)
supabase link --project-ref your-project-ref
supabase db push

# OR using psql
psql postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres < supabase/migrations/001_create_users.sql
psql postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres < supabase/migrations/002_create_companies.sql
# ... run all migrations in order (001 through 009)
```

#### Seed the Database

```bash
# Using psql
psql postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres < supabase/seed/seed.sql

# OR using Supabase dashboard SQL editor, paste contents of seed.sql
```

#### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `uploads`
3. Set it to **public** if you want direct URL access, or configure RLS policies for private access

### 3. Backend Setup

```bash
cd backend-nest

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# JWT_SECRET=your-jwt-secret
# PORT=3000
```

### 4. Mobile App Setup

```bash
cd mobile-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
# EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
# (Use your machine's local IP for testing on physical device, e.g., http://192.168.1.x:3000/api)
```

## ▶️ Running the Project

### Start the Backend

```bash
cd backend-nest
npm run start:dev
```

Backend will run on http://localhost:3000/api

### Start the Mobile App

```bash
cd mobile-app
npm start
# or
expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## 🗄️ Database Migrations

Migrations are located in `supabase/migrations/` and numbered sequentially:

1. **001_create_users.sql** - Users, profiles, roles
2. **002_create_companies.sql** - Companies table
3. **003_create_social_links.sql** - Social media links
4. **004_create_projects.sql** - Projects and members
5. **005_create_schedules.sql** - Schedules and assignments
6. **006_create_posts.sql** - Social feed posts
7. **007_create_comments_likes.sql** - Post interactions
8. **008_create_conversations_messages.sql** - Chat system
9. **009_create_presence.sql** - Typing indicators and online status

### Running Migrations Manually

```bash
# With Supabase CLI
supabase db reset  # Resets and applies all migrations
supabase db push   # Applies new migrations

# With psql (run in order)
for file in supabase/migrations/*.sql; do
  psql $DATABASE_URL < $file
done
```

## 🔐 Environment Variables

### Backend (`backend-nest/.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=3000
NODE_ENV=development

# JWT (for custom auth if needed)
JWT_SECRET=your-secret-key

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# CORS
CORS_ORIGIN=*
```

### Frontend (`mobile-app/.env`)

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

**Note**: For physical device testing, replace `localhost` with your computer's local IP address.

## 🧪 Testing

### Backend Tests

```bash
cd backend-nest

# Run all tests
npm test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

**Test Coverage Target**: 70%+

Included tests:
- `auth.service.spec.ts` - OTP send/verify
- `chat.service.spec.ts` - Message sending, typing, presence
- `posts.service.spec.ts` - Create post, like, comment
- `projects.service.spec.ts` - Create project, add members
- `schedules.service.spec.ts` - Create schedule, update status

### Frontend Tests

```bash
cd mobile-app

# Run all tests
npm test

# Watch mode
npm run test:watch
```

Included tests:
- `FeedPost.test.tsx` - Post component rendering and interactions
- `useCursorPagination.test.ts` - Pagination hook behavior

### Manual QA Checklist

- [ ] User can register with phone + OTP
- [ ] User can see feed posts and paginate
- [ ] User can like and comment on posts
- [ ] User can view members list
- [ ] User can see assigned schedules
- [ ] Artist can accept/decline schedules
- [ ] Recruiter can create projects and schedules
- [ ] Users can start conversations
- [ ] Messages appear in real-time on both devices
- [ ] Typing indicator works correctly
- [ ] Online status updates
- [ ] Cursor pagination loads more data
- [ ] RLS policies prevent unauthorized access

## 📁 Project Structure

```
.
├── backend-nest/          # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Authentication (OTP)
│   │   ├── users/         # User management
│   │   ├── profiles/      # User profiles
│   │   ├── projects/      # Project CRUD
│   │   ├── schedules/     # Schedule management
│   │   ├── posts/         # Social feed
│   │   ├── chat/          # Chat & messaging
│   │   ├── uploads/       # File uploads
│   │   ├── supabase/      # Supabase client
│   │   └── utils/         # Utilities (cursor pagination)
│   ├── test/              # E2E tests
│   └── package.json
│
├── mobile-app/            # React Native (Expo 54)
│   ├── src/
│   │   ├── navigation/    # App navigation
│   │   ├── screens/       # All screens
│   │   │   └── chat/      # Chat screens
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API & Supabase clients
│   │   ├── hooks/         # Custom hooks
│   │   └── styles/        # Design tokens
│   ├── assets/            # Images, icons, Lottie
│   └── package.json
│
├── supabase/
│   ├── migrations/        # SQL migrations (001-009)
│   └── seed/              # Seed data
│
└── README.md              # This file
```

## ✨ Key Features

### Authentication
- **Phone + OTP** authentication (stub implementation for dev)
- Development mode shows OTP in response
- Production: integrate with Twilio/AWS SNS

### Real-time Chat
- **WebSocket-based** via Supabase Realtime
- Server-validated message inserts
- Typing indicators with auto-timeout
- Presence tracking (online/last seen)
- One-on-one and group conversations
- Read receipts (`read_by` JSONB array)

### Social Feed
- Create posts with images and captions
- Like/unlike posts
- Comment on posts
- Cursor-based pagination
- Automatic counts (likes_count, comments_count via triggers)

### Projects & Schedules
- Recruiters create projects and assign artists
- Schedules with date, time, location
- Artists can accept/decline assignments
- Status tracking (pending/accepted/declined)

### Cursor Pagination
- Efficient pagination using `created_at|id` cursors
- Base64 encoded
- Works across all list endpoints
- Handles edge cases (no more data, empty results)

## 📡 API Endpoints

### Auth
- `POST /api/auth/phone/send-otp` - Send OTP
- `POST /api/auth/phone/verify-otp` - Verify OTP & login

### Profiles
- `GET /api/profiles` - List profiles (cursor pagination)
- `GET /api/profiles/:id` - Get profile by ID
- `PUT /api/profiles/:id` - Update profile

### Posts
- `GET /api/posts` - List posts (cursor pagination)
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Toggle like
- `POST /api/posts/:id/comment` - Add comment
- `GET /api/posts/:id/comments` - Get comments

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project (recruiter only)
- `POST /api/projects/:id/members` - Add member
- `GET /api/projects/:id/members` - Get members

### Schedules
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule (recruiter only)
- `PUT /api/schedules/:scheduleId/members/:profileId/status` - Update status

### Chat
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message
- `POST /api/conversations/:id/typing` - Update typing status
- `POST /api/conversations/:id/presence` - Update presence

### Uploads
- `POST /api/uploads` - Upload file (images only, max 6MB)

## 🔒 Security & RLS

All sensitive tables have Row-Level Security (RLS) enabled:

- **Users**: Can read their own record
- **Profiles**: Anyone can read, users can update their own
- **Messages**: Only conversation members can read/insert
- **Conversations**: Only members can access
- **Schedules**: Users see only schedules they created or are assigned to
- **Projects**: Public read, only recruiters can create
- **Posts**: Public read, authenticated users can create

### Testing RLS

```sql
-- Test as a specific user
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try unauthorized access (should fail)
SELECT * FROM messages WHERE conversation_id = 'conv-123';
```

## ⚠️ Known Issues & Caveats

### Expo 54 Compatibility
- **react-native-vector-icons**: Ensure version 10.x for Expo 54
- **react-native-reanimated**: v3.16.1 compatible, ensure Babel plugin is configured
- **GiftedChat**: v2.4.0 works with Expo 54; some prop types may show warnings (safe to ignore)

### OTP Authentication
- Current implementation is a **stub** for development
- In production, replace with Twilio, AWS SNS, or Supabase OTP
- OTPs are stored in-memory (use Redis in production)

### Supabase Auth Integration
- Backend generates placeholder tokens (`temp_token_${userId}`)
- For production, integrate properly with Supabase Auth or implement JWT signing
- Currently, frontend assumes Supabase handles auth sessions

### File Uploads
- Images are processed and resized server-side
- Only images allowed (JPEG, PNG, GIF, WebP)
- Max size: 6MB
- Storage bucket must be created manually in Supabase

### Rate Limiting
- Default: 10 requests/minute per IP
- Chat messages: 10 messages/second per user
- Adjust `THROTTLE_TTL` and `THROTTLE_LIMIT` in `.env`

## 🚀 Production Deployment

### Backend (NestJS)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to**:
   - Railway / Render / Heroku
   - AWS ECS / Google Cloud Run
   - DigitalOcean App Platform

3. **Environment variables**:
   - Set all `.env` vars in your hosting platform
   - Ensure `NODE_ENV=production`
   - Use strong `JWT_SECRET`

4. **Monitoring**:
   - Set up Sentry for error tracking
   - Use PM2 or similar for process management
   - Enable HTTPS

### Frontend (Expo)

1. **Build for production**:
   ```bash
   # iOS
   eas build --platform ios

   # Android
   eas build --platform android
   ```

2. **Submit to stores**:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

3. **Update environment**:
   - Update `EXPO_PUBLIC_API_BASE_URL` to production API
   - Ensure Supabase URL and keys are correct

### Database

- Supabase handles scaling automatically
- For large datasets, consider:
  - Database indexing (already included in migrations)
  - Connection pooling (Supabase includes this)
  - Read replicas (Supabase Pro plan)

### Supabase Realtime

- Free plan: 200 concurrent connections
- Pro plan: 500+ concurrent connections
- Monitor usage in Supabase dashboard

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [GiftedChat](https://github.com/FaridSafi/react-native-gifted-chat)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the Tamil film industry**

For questions or support, please open an issue on GitHub.

