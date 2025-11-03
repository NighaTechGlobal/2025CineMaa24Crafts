import { IsString, IsOptional, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  poster_url?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsEnum(['open', 'closed', 'in_progress', 'completed'])
  status?: string;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  poster_url?: string;

  @IsOptional()
  @IsEnum(['open', 'closed', 'in_progress', 'completed'])
  status?: string;
}

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class ApplyToProjectDto {
  @IsOptional()
  @IsString()
  cover_letter?: string;

  @IsOptional()
  @IsString()
  portfolio_link?: string;
}

export class UpdateApplicationStatusDto {
  @IsNotEmpty()
  @IsEnum(['pending', 'accepted', 'rejected', 'withdrawn'])
  status: string;
}

export interface ListPostsQuery {
  cursor?: string;
  limit?: number;
  profileId?: string;
  role?: string; // To filter posts by author role
}

export interface ListCommentsQuery {
  cursor?: string;
  limit?: number;
}

export interface ListApplicationsQuery {
  cursor?: string;
  limit?: number;
  projectId?: string;
  artistProfileId?: string;
  status?: string;
}

