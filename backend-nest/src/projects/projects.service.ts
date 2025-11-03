import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateProjectDto,
  AddProjectMemberDto,
  ListProjectsQuery,
} from './dto/project.dto';
import { encodeCursor, decodeCursor, PaginatedResponse } from '../utils/cursor.util';

@Injectable()
export class ProjectsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listProjects(query: ListProjectsQuery): Promise<PaginatedResponse<any>> {
    const { cursor, limit = 20, profileId } = query;
    const supabase = this.supabaseService.getAdminClient();

    let queryBuilder = supabase
      .from('projects')
      .select(`
        *,
        profiles!created_by(id, first_name, last_name, profile_photo_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    // Filter by profile if provided (projects created by or member of)
    if (profileId) {
      // This will need a more complex query to include both created and member projects
      // For simplicity, we'll filter by created_by for now
      queryBuilder = queryBuilder.eq('created_by', profileId);
    }

    // Apply cursor if provided
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        queryBuilder = queryBuilder.lt('created_at', decoded.timestamp);
      }
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error('Failed to fetch projects');
    }

    const hasMore = data.length > limit;
    const projects = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore
      ? encodeCursor(data[limit - 1].created_at, data[limit - 1].id)
      : null;

    return {
      data: projects,
      nextCursor,
    };
  }

  async getProjectById(id: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!created_by(id, first_name, last_name, profile_photo_url)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Project not found');
    }

    return data;
  }

  async createProject(createdBy: string, createProjectDto: CreateProjectDto) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...createProjectDto,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create project');
    }

    return data;
  }

  async addMember(projectId: string, addMemberDto: AddProjectMemberDto) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        profile_id: addMemberDto.profile_id,
        role_in_project: addMemberDto.role_in_project,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to add project member');
    }

    return data;
  }

  async getProjectMembers(projectId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('project_members')
      .select(`
        *,
        profiles(id, first_name, last_name, profile_photo_url, department)
      `)
      .eq('project_id', projectId);

    if (error) {
      throw new Error('Failed to fetch project members');
    }

    return data;
  }
}

