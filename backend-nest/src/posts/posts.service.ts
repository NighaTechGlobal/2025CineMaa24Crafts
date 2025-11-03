import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePostDto, UpdatePostDto, ListPostsQuery, ListCommentsQuery, ApplyToProjectDto, ListApplicationsQuery, UpdateApplicationStatusDto } from './dto/post.dto';
import { encodeCursor, decodeCursor, PaginatedResponse } from '../utils/cursor.util';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async listPosts(query: ListPostsQuery): Promise<PaginatedResponse<any>> {
    const { cursor, limit = 20, profileId, role } = query;
    this.logger.log(`📋 listPosts called with: cursor=${cursor ? 'provided' : 'none'}, limit=${limit}, profileId=${profileId || 'none'}, role=${role || 'none'}`);
    
    const supabase = this.supabaseService.getAdminClient();

    let queryBuilder = supabase
      .from('posts')
      .select(`
        *,
        profiles!author_profile_id(id, first_name, last_name, profile_photo_url, role, is_premium)
      `)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    // Filter by profile if provided
    if (profileId) {
      this.logger.log(`🔍 Filtering posts by profileId: ${profileId}`);
      queryBuilder = queryBuilder.eq('author_profile_id', profileId);
    }

    // Filter by author role if provided
    if (role) {
      this.logger.log(`🔍 Filtering posts by role: ${role}`);
      queryBuilder = queryBuilder.eq('profiles.role', role);
    }

    // Apply cursor if provided
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        this.logger.log(`📍 Using cursor: timestamp=${decoded.timestamp}`);
        queryBuilder = queryBuilder.lt('created_at', decoded.timestamp);
      }
    }

    this.logger.log(`🔄 Executing posts query...`);
    const { data, error } = await queryBuilder;

    if (error) {
      this.logger.error(`❌ Failed to fetch posts: ${error.message}`, error);
      throw new BadRequestException(`Failed to fetch posts: ${error.message}`);
    }

    const hasMore = data.length > limit;
    const posts = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore
      ? encodeCursor(data[limit - 1].created_at, data[limit - 1].id)
      : null;

    this.logger.log(`✅ Successfully fetched ${posts.length} posts, hasMore=${hasMore}`);
    if (posts.length > 0) {
      this.logger.log(`📝 First post ID: ${posts[0].id}, title: ${posts[0].title}`);
    }

    return {
      data: posts,
      nextCursor,
    };
  }

  async getPostById(id: string) {
    this.logger.log(`🔍 getPostById called with ID: ${id}`);
    this.logger.log(`📊 ID type: ${typeof id}, length: ${id?.length}`);
    
    const supabase = this.supabaseService.getAdminClient();

    this.logger.log(`🔄 Querying posts table for ID: ${id}`);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!author_profile_id(id, first_name, last_name, profile_photo_url, role)
      `)
      .eq('id', id)
      .single();

    if (error) {
      this.logger.error(`❌ Error fetching post: ${error.message}`, error);
      throw new NotFoundException('Post not found');
    }

    if (!data) {
      this.logger.warn(`⚠️  No data returned for post ID: ${id}`);
      throw new NotFoundException('Post not found');
    }

    this.logger.log(`✅ Successfully fetched post: ${data.title} (ID: ${data.id})`);
    this.logger.log(`👤 Author: ${data.profiles?.first_name} ${data.profiles?.last_name}`);
    
    return data;
  }

  async createPost(
    profileId: string,
    createPostDto: CreatePostDto,
    file?: Express.Multer.File,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify that the profile is a recruiter
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', profileId)
      .single();

    if (!profile || profile.role !== 'recruiter') {
      throw new ForbiddenException('Only recruiters can create projects');
    }

    let posterUrl = createPostDto.poster_url;

    // TODO: Upload file to Supabase Storage if provided

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_profile_id: profileId,
        title: createPostDto.title,
        description: createPostDto.description,
        requirements: createPostDto.requirements,
        location: createPostDto.location,
        department: createPostDto.department,
        deadline: createPostDto.deadline,
        poster_url: posterUrl,
        caption: createPostDto.caption,
        status: createPostDto.status || 'open',
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create post:', error);
      throw new BadRequestException(`Failed to create post: ${error.message}`);
    }

    return data;
  }

  async updatePost(
    postId: string,
    profileId: string,
    updatePostDto: UpdatePostDto,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    const { data: post } = await supabase
      .from('posts')
      .select('author_profile_id')
      .eq('id', postId)
      .single();

    if (!post || post.author_profile_id !== profileId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const { data, error } = await supabase
      .from('posts')
      .update(updatePostDto)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update post:', error);
      throw new BadRequestException(`Failed to update post: ${error.message}`);
    }

    return data;
  }

  async deletePost(postId: string, profileId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify ownership
    const { data: post } = await supabase
      .from('posts')
      .select('author_profile_id')
      .eq('id', postId)
      .single();

    if (!post || post.author_profile_id !== profileId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      this.logger.error('Failed to delete post:', error);
      throw new BadRequestException(`Failed to delete post: ${error.message}`);
    }

    return { success: true, message: 'Post deleted successfully' };
  }

  async toggleLike(postId: string, profileId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Check if already liked
    const { data: existing } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('profile_id', profileId)
      .single();

    if (existing) {
      // Unlike
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('profile_id', profileId);

      return { liked: false };
    } else {
      // Like
      await supabase.from('post_likes').insert({
        post_id: postId,
        profile_id: profileId,
      });

      return { liked: true };
    }
  }

  async addComment(postId: string, profileId: string, content: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_profile_id: profileId,
        content,
      })
      .select(`
        *,
        profiles!author_profile_id(id, first_name, last_name, profile_photo_url)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to add comment: ${error.message}`);
    }

    return data;
  }

  async getComments(
    postId: string,
    query: ListCommentsQuery,
  ): Promise<PaginatedResponse<any>> {
    const { cursor, limit = 20 } = query;
    const supabase = this.supabaseService.getAdminClient();

    let queryBuilder = supabase
      .from('post_comments')
      .select(`
        *,
        profiles!author_profile_id(id, first_name, last_name, profile_photo_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(limit + 1);

    // Apply cursor if provided
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        queryBuilder = queryBuilder.gt('created_at', decoded.timestamp);
      }
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new BadRequestException(`Failed to fetch comments: ${error.message}`);
    }

    const hasMore = data.length > limit;
    const comments = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore
      ? encodeCursor(data[limit - 1].created_at, data[limit - 1].id)
      : null;

    return {
      data: comments,
      nextCursor,
    };
  }

  // Project Application Methods

  async applyToProject(
    projectId: string,
    artistProfileId: string,
    applyDto: ApplyToProjectDto,
  ) {
    this.logger.log(`📝 applyToProject called - projectId: ${projectId}, artistProfileId: ${artistProfileId}`);
    this.logger.log(`📋 Application data: ${JSON.stringify(applyDto)}`);
    
    const supabase = this.supabaseService.getAdminClient();

    // Verify that the profile is an artist
    this.logger.log(`🔍 Verifying artist profile: ${artistProfileId}`);
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', artistProfileId)
      .single();

    if (!profile || profile.role !== 'artist') {
      this.logger.warn(`⚠️  Non-artist profile attempted to apply: ${artistProfileId}, role: ${profile?.role}`);
      throw new ForbiddenException('Only artists can apply to projects');
    }
    
    this.logger.log(`✅ Artist profile verified: ${artistProfileId}`);

    // Verify that the project exists and is open
    this.logger.log(`🔍 Checking if project exists: ${projectId}`);
    const { data: project } = await supabase
      .from('posts')
      .select('status')
      .eq('id', projectId)
      .single();

    if (!project) {
      this.logger.warn(`⚠️  Project not found: ${projectId}`);
      throw new NotFoundException('Project not found');
    }

    this.logger.log(`📊 Project status: ${project.status}`);
    if (project.status !== 'open') {
      this.logger.warn(`⚠️  Project is not open for applications: ${projectId}, status: ${project.status}`);
      throw new BadRequestException('This project is no longer accepting applications');
    }

    // Check if already applied
    this.logger.log(`🔍 Checking if already applied to project: ${projectId}`);
    const { data: existing } = await supabase
      .from('project_applications')
      .select('id')
      .eq('project_id', projectId)
      .eq('artist_profile_id', artistProfileId)
      .maybeSingle();

    if (existing) {
      this.logger.warn(`⚠️  Artist has already applied: artistProfileId=${artistProfileId}, projectId=${projectId}`);
      throw new BadRequestException('You have already applied to this project');
    }

    // Create application
    this.logger.log(`💾 Creating new application for project: ${projectId}`);
    const { data, error } = await supabase
      .from('project_applications')
      .insert({
        project_id: projectId,
        artist_profile_id: artistProfileId,
        cover_letter: applyDto.cover_letter,
        portfolio_link: applyDto.portfolio_link,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`❌ Failed to create application: ${error.message}`, error);
      throw new BadRequestException(`Failed to apply to project: ${error.message}`);
    }

    this.logger.log(`✅ Application created successfully: ID=${data.id}`);
    return data;
  }

  async listApplications(query: ListApplicationsQuery): Promise<PaginatedResponse<any>> {
    const { cursor, limit = 20, projectId, artistProfileId, status } = query;
    this.logger.log(`📋 listApplications called - projectId: ${projectId || 'none'}, artistProfileId: ${artistProfileId || 'none'}, status: ${status || 'all'}, limit: ${limit}`);
    
    const supabase = this.supabaseService.getAdminClient();

    let queryBuilder = supabase
      .from('project_applications')
      .select(`
        *,
        artist_profile:profiles!artist_profile_id(
          id, first_name, last_name, profile_photo_url, role,
          artist_profiles(
            department, city, state, alt_phone, maa_associative_number
          )
        ),
        project:posts!project_id(
          id, title, description, department, location, image_url, poster_url, deadline, status
        )
      `)
      .order('applied_at', { ascending: false })
      .limit(limit + 1);

    // Filter by project if provided
    if (projectId) {
      this.logger.log(`🔍 Filtering by projectId: ${projectId}`);
      queryBuilder = queryBuilder.eq('project_id', projectId);
    }

    // Filter by artist if provided
    if (artistProfileId) {
      this.logger.log(`🔍 Filtering by artistProfileId: ${artistProfileId}`);
      queryBuilder = queryBuilder.eq('artist_profile_id', artistProfileId);
    }

    // Filter by status if provided
    if (status) {
      this.logger.log(`🔍 Filtering by status: ${status}`);
      queryBuilder = queryBuilder.eq('status', status);
    }

    // Apply cursor if provided
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        queryBuilder = queryBuilder.lt('applied_at', decoded.timestamp);
      }
    }

    this.logger.log(`🔄 Executing applications query...`);
    const { data, error } = await queryBuilder;

    if (error) {
      this.logger.error(`❌ Failed to fetch applications: ${error.message}`, error);
      throw new BadRequestException(`Failed to fetch applications: ${error.message}`);
    }

    // Transform data to maintain frontend compatibility
    const transformedData = (data || []).map((app: any) => {
      const profile = app.artist_profile || app.profiles;
      // artist_profiles is a one-to-one relationship, handle both object and array cases
      const artistProfileData = Array.isArray(profile?.artist_profiles) 
        ? (profile.artist_profiles[0] || {})
        : (profile?.artist_profiles || {});
      
      // Flatten artist_profiles fields into the main profile object
      const flattenedProfile = profile ? {
        ...profile,
        ...artistProfileData,
        artist_profiles: undefined, // Remove nested object
      } : profile;

      return {
        ...app,
        profiles: flattenedProfile,
        posts: app.project || app.posts, // Use alias or fallback
      };
    });

    const hasMore = transformedData.length > limit;
    const applications = hasMore ? transformedData.slice(0, limit) : transformedData;
    const nextCursor = hasMore
      ? encodeCursor(applications[applications.length - 1].applied_at, applications[applications.length - 1].id)
      : null;

    this.logger.log(`✅ Successfully fetched ${applications.length} applications, hasMore=${hasMore}`);
    return {
      data: applications,
      nextCursor,
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    recruiterProfileId: string,
    updateDto: UpdateApplicationStatusDto,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Get the application with project details
    const { data: application } = await supabase
      .from('project_applications')
      .select(`
        *,
        posts!project_id(author_profile_id)
      `)
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify that the recruiter owns the project
    if (application.posts.author_profile_id !== recruiterProfileId) {
      throw new ForbiddenException('You can only manage applications for your own projects');
    }

    // Update status
    const { data, error } = await supabase
      .from('project_applications')
      .update({ status: updateDto.status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update application status:', error);
      throw new BadRequestException(`Failed to update application status: ${error.message}`);
    }

    return data;
  }

  async removeApplication(
    applicationId: string,
    profileId: string,
    isRecruiter: boolean,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    const { data: application } = await supabase
      .from('project_applications')
      .select(`
        *,
        posts!project_id(author_profile_id)
      `)
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Artists can only remove their own applications
    // Recruiters can remove any application from their projects
    const canRemove = isRecruiter
      ? application.posts.author_profile_id === profileId
      : application.artist_profile_id === profileId;

    if (!canRemove) {
      throw new ForbiddenException('You do not have permission to remove this application');
    }

    const { error } = await supabase
      .from('project_applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      this.logger.error('Failed to remove application:', error);
      throw new BadRequestException(`Failed to remove application: ${error.message}`);
    }

    return { success: true, message: 'Application removed successfully' };
  }

  async checkApplicationStatus(projectId: string, artistProfileId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('project_applications')
      .select('id, status, applied_at')
      .eq('project_id', projectId)
      .eq('artist_profile_id', artistProfileId)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to check application status:', error);
      return { hasApplied: false };
    }

    return {
      hasApplied: !!data,
      application: data,
    };
  }
}

