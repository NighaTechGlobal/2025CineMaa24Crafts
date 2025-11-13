import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateProjectDto,
  AddProjectMemberDto,
  ListProjectsQuery,
} from './dto/project.dto';
import { encodeCursor, decodeCursor, PaginatedResponse } from '../utils/cursor.util';

function detectMime(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp';
  return 'image/jpeg';
}

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
    // Normalize image to a data URI so mobile/web can render it consistently
    const normalizeImage = (item: any) => {
      if (!item) return item;
      const value = item.image;
      if (!value) return item;
      try {
        if (typeof value === 'string') {
          // Already a data URI
          if (/^data:image\/.+;base64,/.test(value)) {
            return item;
          }
          // Supabase bytea hex string
          if (value.startsWith('\\x')) {
            const buf = Buffer.from(value.slice(2), 'hex');
            const mime = detectMime(buf);
            const b64 = buf.toString('base64');
            return { ...item, image: `data:${mime};base64,${b64}` };
          }
          // Plain base64 string: add prefix
          const normalized = value.replace(/\s+/g, '');
          const isBase64 = /^[A-Za-z0-9+/\n\r]+={0,2}$/.test(normalized);
          if (isBase64) {
            try {
              const buf = Buffer.from(normalized, 'base64');
              const mime = detectMime(buf);
              return { ...item, image: `data:${mime};base64,${normalized}` };
            } catch {
              return { ...item, image: `data:image/jpeg;base64,${normalized}` };
            }
          }
        } else if (typeof value === 'object' && value) {
          const dataArr = (value as any).type === 'Buffer' && Array.isArray((value as any).data)
            ? (value as any).data
            : Array.isArray((value as any))
              ? (value as any)
              : (value as any).data;
          if (Array.isArray(dataArr)) {
            const buf = Buffer.from(Uint8Array.from(dataArr));
            const mime = detectMime(buf);
            const b64 = buf.toString('base64');
            return { ...item, image: `data:${mime};base64,${b64}` };
          }
        }
      } catch {}
      return item;
    };

    const projectsRaw = hasMore ? data.slice(0, limit) : data;
    const projects = projectsRaw.map(normalizeImage);
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

    // Normalize to data URI for a single project
    if (data && typeof data.image === 'string' && data.image) {
      try {
        if (!/^data:image\/.+;base64,/.test(data.image)) {
          if (data.image.startsWith('\\x')) {
            const buf = Buffer.from(data.image.slice(2), 'hex');
            const mime = detectMime(buf);
            data.image = `data:${mime};base64,${buf.toString('base64')}`;
          } else {
            const normalized = data.image.replace(/\s+/g, '');
            const isBase64 = /^[A-Za-z0-9+/\n\r]+={0,2}$/.test(normalized);
            if (isBase64) {
              try {
                const buf = Buffer.from(normalized, 'base64');
                const mime = detectMime(buf);
                data.image = `data:${mime};base64,${normalized}`;
              } catch {
                data.image = `data:image/jpeg;base64,${normalized}`;
              }
            }
          }
        }
      } catch {}
    } else if (data && typeof (data as any).image === 'object' && (data as any).image) {
      try {
        const value: any = (data as any).image;
        const dataArr = value?.type === 'Buffer' && Array.isArray(value?.data)
          ? value.data
          : Array.isArray(value)
            ? value
            : value?.data;
        if (Array.isArray(dataArr)) {
          const buf = Buffer.from(Uint8Array.from(dataArr));
          const mime = detectMime(buf);
          (data as any).image = `data:${mime};base64,${buf.toString('base64')}`;
        }
      } catch {}
    }
    return data;
  }

  async createProject(createdBy: string, createProjectDto: CreateProjectDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Normalize and convert base64 image to Buffer for bytea column
    const { image, ...rest } = createProjectDto as any;
    let imageBuffer = null;
    if (image) {
      try {
        const normalized = (image as string)
          .trim()
          .replace(/^data:[^;]+;base64,/, '')
          .replace(/\s+/g, '');
        imageBuffer = Buffer.from(normalized, 'base64');
      } catch (e) {
        imageBuffer = null;
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...rest,
        image: imageBuffer,
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

