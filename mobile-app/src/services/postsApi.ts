// postsApi.ts - Post-related API calls
import { listPosts } from './api';
import { logger } from '../utils/logger';

export interface PostAuthor {
    id: string;
    name: string;
    avatarUrl: string;
    isVerified: boolean;
}

export interface Post {
    id: string;
    author: PostAuthor;
    image?: string; // base64 string
    caption: string;
    savedByMe: boolean;
    timestamp: string;
    projectId?: string;
    scheduleId?: string;
}

/**
 * Fetch posts with pagination
 * @param skip - Number of posts to skip
 * @param limit - Number of posts to fetch
 * @returns Promise with array of posts
 */
export async function fetchPosts(skip = 0, limit = 10): Promise<Post[]> {
    try {
        logger.debug(`Fetching posts with skip=${skip}, limit=${limit}`);
        
        const response = await listPosts(undefined, limit);
        
        // Transform backend response to match UI interface
        const posts: Post[] = (response.data || []).map((post: any) => {
            // Handle profiles which could be an object or array depending on the backend response
            const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
            
            return {
                id: post.id,
                author: {
                    id: post.author_profile_id || profile?.id || 'unknown',
                    name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
                    avatarUrl: profile?.profile_photo_url || 'https://via.placeholder.com/40',
                    isVerified: profile?.is_premium || false,
                },
                image: post.image_url || undefined,
                caption: post.caption || post.description || post.title || '',
                savedByMe: false, // TODO: Implement save functionality
                timestamp: post.created_at,
                projectId: post.id,
            };
        });

        logger.debug(`Fetched ${posts.length} posts from API`);
        return posts;
    } catch (error) {
        logger.error('Error fetching posts:', error);
        // Return empty array instead of mock data on error
        return [];
    }
}


/**
 * Save or unsave a post
 * @param postId - ID of the post to save/unsave
 * @param save - True to save, false to unsave
 * @returns Promise with success status
 */
export async function savePost(postId: string, save: boolean) {
    // TODO: Implement Supabase/NestJS endpoint call to save/unsave post
    logger.debug(`Setting save status for post ${postId} to ${save}`);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 300);
    });
}
