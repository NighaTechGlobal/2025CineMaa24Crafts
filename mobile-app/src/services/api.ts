import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { getToken, clearAuthData, getSessionId } from './authStorage';
import { logger } from '../utils/logger';

// Resolve API base URL with sensible development fallbacks
const envBase = process.env.EXPO_PUBLIC_API_BASE_URL;
const devHost = process.env.EXPO_PUBLIC_DEV_HOST; // optional: e.g. 192.168.1.10

// Try to infer the Metro bundler host (works in Expo Go on device)
function getBundleHost(): string | null {
  try {
    const scriptURL = (NativeModules as any)?.SourceCode?.scriptURL as string | undefined;
    if (scriptURL) {
      const url = new URL(scriptURL);
      return url.hostname || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

const bundleHost = getBundleHost();

// Prefer explicit env, then dev host for LAN, then bundle host, then localhost
let API_BASE_URL = envBase
  || (devHost ? `http://${devHost}:3000` : bundleHost ? `http://${bundleHost}:3000` : `http://localhost:3000`);

// Add /api suffix if not already present
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}

if (__DEV__) {
  logger.debug('═══════════════════════════════════════');
  logger.debug('[API] Base URL:', `${API_BASE_URL}`);
  logger.debug('[API] Platform:', Platform.OS);
  logger.debug('[API] Env EXPO_PUBLIC_API_BASE_URL:', envBase || 'NOT SET (using default)');
  logger.debug('[API] Env EXPO_PUBLIC_DEV_HOST:', devHost || 'NOT SET');
  logger.debug('═══════════════════════════════════════');
}

const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/+$/, '')}`,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add logging and auth token to requests
api.interceptors.request.use(
  async (config) => {
    if (__DEV__) {
      logger.debug(`[API] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    const sessionId = await getSessionId();
    const token = await getToken();

    // Choose auth header based on endpoint requirements
    // - JWT only: /auth/profile, /admin, /users, /projects, /conversations, /uploads
    // - Session: everything else (e.g., /posts, /profiles, /schedules)
    const path = (config.url || '').toString();
    const requiresJwt = (
      path.startsWith('/auth/profile') ||
      path.startsWith('/admin') ||
      path.startsWith('/users') ||
      path.startsWith('/projects') ||
      path.startsWith('/conversations') ||
      path.startsWith('/uploads') ||
      path.startsWith('/notifications')
    );
    if (requiresJwt && token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (sessionId) {
      // Prefer Session header for non-JWT endpoints, including /auth/session/validate
      config.headers.Authorization = `Session ${sessionId}`;
    } else if (token) {
      // Fallback: use JWT when session is unavailable
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      if (error.response.status === 401) {
        // Token invalid/expired – clear and let app redirect to login on next render
        clearAuthData().catch(() => { });
      }
      if (__DEV__) logger.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      if (__DEV__) logger.error('Network Error:', error.message);
    } else {
      // Something else happened
      if (__DEV__) logger.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const sendOtp = async (phone: string) => {
  const { data } = await api.post('/auth/send-otp', { phone });
  return data;
};

export const verifyOtp = async (phone: string, otp: string) => {
  const { data } = await api.post('/auth/verify-otp', { phone, otp });
  return data;
};

// Session auth endpoints
export const sessionLogin = async (phone: string, otp: string, deviceInfo?: string) => {
  const { data } = await api.post('/auth/session/login', { phone, otp, deviceInfo });
  return data;
};

export const sessionLogout = async () => {
  const { data } = await api.post('/auth/session/logout');
  return data;
};

export const validateSession = async () => {
  const { data } = await api.get('/auth/session/validate');
  return data;
};

export const signup = async (signupData: {
  phone: string;
  otp: string;
  firstName: string;
  lastName?: string;
  email: string;
  alternativePhone?: string;
  maaAssociativeNumber?: string;
  gender: string;
  department?: string;
  state: string;
  city: string;
  profilePhoto?: string;
  role: 'artist' | 'recruiter';
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  customLinks?: string[];
  aadharFront?: string;
  aadharBack?: string;
  bio?: string;
}) => {
  try {
    const { data } = await api.post('/auth/signup', signupData);
    return data;
  } catch (error: any) {
    if (__DEV__) {
      logger.error('Signup API Error:', error);
      if (error.response) {
        logger.error('Response data:', error.response.data);
      }
    }
    throw error;
  }
};

export const getAuthProfile = async () => {
  const response = await api.get('/auth/profile');
  // Some environments may return 304 with an empty body; normalize to safe shape
  return response.data ?? { user: null, profile: null };
};

// Profile endpoints
export const getCurrentProfile = async () => {
  // Use auth endpoint that returns current user's profile
  const { data } = await api.get('/auth/profile');
  return data;
};

export const getProfile = async (id: string) => {
  const { data } = await api.get(`/profiles/${id}`);
  return data;
};

export const updateProfile = async (id: string, updates: any) => {
  const { data } = await api.put(`/profiles/${id}`, updates);
  return data;
};

export const listProfiles = async (cursor?: string, limit = 20, role?: string) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  if (role) params.role = role;
  if (__DEV__) {
    logger.debug('api.ts listProfiles: GET /profiles', params);
  }
  const response = await api.get('/profiles', { params });
  // Normalize 304 or empty bodies to safe defaults to avoid undefined dereferences
  return response.data ?? { data: [], nextCursor: null };
};

export const becomeRecruiter = async (profileId: string, recruiterData: {
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
}) => {
  const { data } = await api.post(`/profiles/${profileId}/become-recruiter`, recruiterData);
  return data;
};

export const upgradePremium = async (profileId: string, planData: {
  planType: string;
  paymentId?: string;
}) => {
  const { data } = await api.post(`/profiles/${profileId}/upgrade-premium`, planData);
  return data;
};

// Notifications endpoints
export const savePushToken = async (payload: {
  token: string;
  platform: 'ios' | 'android';
  device_name?: string;
  app_version?: string;
  os_version?: string;
  timezone?: string;
}) => {
  const { data } = await api.post('/notifications/save-token', payload);
  return data;
};

export const revokePushToken = async (payload: { token: string }) => {
  const { data } = await api.post('/notifications/revoke-token', payload);
  return data;
};

export const getMyDevices = async () => {
  const { data } = await api.get('/notifications/my-devices');
  return data;
};

// Posts endpoints
export const listPosts = async (
  cursor?: string,
  limit = 20,
  profileId?: string,
  role?: string,
  department?: string,
) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  if (profileId) params.profileId = profileId;
  if (role) params.role = role;
  if (department) params.department = department;
  const response = await api.get('/posts', { params });
  // Ensure callers can always access .data safely even on 304
  return response.data ?? { data: [], nextCursor: null };
};

export const createPost = async (postData: any) => {
  // Expect `image` field to be a base64 string already. No URL handling.
  const { data } = await api.post('/posts', postData);
  return data;
};

export const toggleLike = async (postId: string) => {
  const { data } = await api.post(`/posts/${postId}/like`);
  return data;
};

export const addComment = async (postId: string, content: string) => {
  const { data } = await api.post(`/posts/${postId}/comment`, { content });
  return data;
};

export const getComments = async (postId: string, cursor?: string, limit = 20) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await api.get(`/posts/${postId}/comments`, { params });
  return data;
};

// Projects endpoints
// Note: Projects functionality uses /posts endpoint (posts are job postings/projects)
// The /projects endpoint is for managing actual project teams after hiring
export const listProjects = async (cursor?: string, limit = 20, profileId?: string) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  if (profileId) params.profileId = profileId;
  const response = await api.get('/projects', { params });
  return response.data ?? { data: [], nextCursor: null };
};

export const createProject = async (projectData: any) => {
  const { data } = await api.post('/projects', projectData);
  return data;
};

export const getProject = async (id: string) => {
  const { data } = await api.get(`/projects/${id}`);
  return data;
};

export const getProjectMembers = async (projectId: string) => {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data;
};

export const addProjectMember = async (projectId: string, profileId: string, roleInProject?: string) => {
  const payload: any = { profile_id: profileId };
  if (roleInProject) payload.role_in_project = roleInProject;
  const { data } = await api.post(`/projects/${projectId}/members`, payload);
  return data;
};

// Project Application endpoints
export const applyToProject = async (projectId: string, coverLetter?: string) => {
  const { data } = await api.post(`/posts/${projectId}/apply`, { coverLetter });
  return data;
};

export const getProjectApplications = async (projectId: string, cursor?: string, limit = 20, status?: string) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  if (status) params.status = status;
  const { data } = await api.get(`/posts/${projectId}/applications`, { params });
  return data;
};

export const getMyApplications = async (cursor?: string, limit = 20, status?: string) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  if (status) params.status = status;
  const response = await api.get('/posts/applications/my-applications', { params });
  // Applications endpoints usually return an array in `data`
  return response.data ?? { data: [], nextCursor: null };
};

export const checkApplicationStatus = async (projectId: string) => {
  const { data } = await api.get(`/posts/${projectId}/application-status`);
  return data;
};

export const updateApplicationStatus = async (applicationId: string, status: string) => {
  const { data } = await api.put(`/posts/applications/${applicationId}/status`, { status });
  return data;
};

export const removeApplication = async (applicationId: string) => {
  const { data } = await api.delete(`/posts/applications/${applicationId}`);
  return data;
};

export const getPost = async (id: string) => {
  logger.debug('api.ts getPost: Fetching post with ID:', id);
  logger.debug('api.ts getPost: ID type:', typeof id);
  logger.debug('api.ts getPost: Full URL:', `/posts/${id}`);
  const { data } = await api.get(`/posts/${id}`);
  logger.debug('api.ts getPost: Response received:', data);
  return data;
};

export const updatePost = async (id: string, updates: any) => {
  const { data } = await api.put(`/posts/${id}`, updates);
  return data;
};

export const deletePost = async (id: string) => {
  const { data } = await api.delete(`/posts/${id}`);
  return data;
};

// Schedules endpoints
export const listSchedules = async (cursor?: string, limit = 20, profileId?: string, projectId?: string) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  if (profileId) params.profileId = profileId;
  if (projectId) params.projectId = projectId;
  const response = await api.get('/schedules', { params });
  // Cursor-paginated schedules: always return `{ data, nextCursor }`
  return response.data ?? { data: [], nextCursor: null };
};

export const createSchedule = async (scheduleData: any) => {
  const { data } = await api.post('/schedules', scheduleData);
  return data;
};

export const updateScheduleMemberStatus = async (scheduleId: string, profileId: string, status: string) => {
  const { data } = await api.put(`/schedules/${scheduleId}/members/${profileId}/status`, { status });
  return data;
};

export const getRecruiterProjects = async () => {
  const { data } = await api.get('/schedules/recruiter/projects');
  return data;
};

// Chat endpoints
export const listConversations = async (profileId: string, cursor?: string, limit = 20) => {
  const params: any = { profileId, limit };
  if (cursor) params.cursor = cursor;
  const { data } = await api.get('/conversations', { params });
  return data;
};

export const getConversation = async (id: string) => {
  const { data } = await api.get(`/conversations/${id}`);
  return data;
};

export const createConversation = async (conversationData: any) => {
  const { data } = await api.post('/conversations', conversationData);
  return data;
};

export const getMessages = async (conversationId: string, cursor?: string, limit = 40) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await api.get(`/conversations/${conversationId}/messages`, { params });
  return data;
};

export const sendMessage = async (
  conversationId: string,
  content: string,
  metadata?: any,
  clientMsgId?: string,
) => {
  const payload: any = { content, metadata };
  if (clientMsgId) payload.client_msg_id = clientMsgId;
  const { data } = await api.post(`/conversations/${conversationId}/messages`, payload);
  return data;
};

export const updateTyping = async (conversationId: string, isTyping: boolean) => {
  const { data } = await api.post(`/conversations/${conversationId}/typing`, { is_typing: isTyping });
  return data;
};

export const updatePresence = async (conversationId: string) => {
  const { data } = await api.post(`/conversations/${conversationId}/presence`);
  return data;
};

// Uploads endpoint
export const uploadFile = async (file: any) => {
  // Accept either a raw file object ({ uri, name, type }) or a prebuilt FormData
  const formData = file instanceof FormData
    ? file
    : (() => {
        const fd = new FormData();
        // Ensure we have expected shape
        // file can be { uri, name, type } or a Blob-like
        fd.append('file', file);
        return fd;
      })();

  const { data } = await api.post('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Convert image URI to base64
export const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    // Handle local file URIs via FileSystem for React Native
    if (uri.startsWith('file://')) {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      return base64;
    }

    // Fallback: fetch remote http(s) URIs and convert blob to base64
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = base64data.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

export default api;
