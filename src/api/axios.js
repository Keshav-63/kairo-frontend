// src/api/axios.js
import axios from 'axios';
import authStore from '../stores/authStore';
import { toast } from "react-hot-toast";

// This instance is for your OAuth and user management API
const api = axios.create({
  baseURL: 'https://shreeyanshsingh-raghuvanshi-kairob.hf.space/api', 
  withCredentials: true,
});

// This new instance is specifically for the Python Kairo pipeline
export const pipelineApi = axios.create({
  baseURL: 'https://keshavsuthar-kairo-api.hf.space', 
});

// Apply interceptors to both instances if they share the same auth token logic
// This ensures that requests to either backend are authenticated.
const instances = [api, pipelineApi];

instances.forEach(instance => {
  instance.interceptors.request.use(config => {
    const token = authStore.getState().token;
    if (token) {
      // Assuming both APIs use the same Bearer token format
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => {
    return Promise.reject(error);
  });
});


// --- Query and Chat functions now correctly use `pipelineApi` ---

export const queryAI = async (userId, query, session_id) => {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('query', query);
  formData.append('session_id', session_id);

  // Use pipelineApi
  const response = await pipelineApi.post('/query', formData, {
    headers: {
      'Content-Type': 'multipart/json',
    },
  });
  return response.data;
};

export const createChatSession = async (userId) => {
  // Use pipelineApi
  const response = await pipelineApi.post('/chats', { user_id: userId });
  return response.data;
};

export const getUserChats = async (userId) => {
  if (!userId) return [];
  // Use pipelineApi
  const response = await pipelineApi.get(`/chats/user/${userId}`);
  return response.data;
};

export const getChatHistory = async (sessionId) => {
  if (!sessionId) return null;
  console.log("Fetching chat history for session ID:", sessionId);
  // Use pipelineApi
  const response = await pipelineApi.get(`/chats/${sessionId}`);
  console.log("Chat history response:", response.data);
  return response.data;
};


export const getRecordings = async (userId) => {
  if (!userId) return [];
  try {
    const response = await pipelineApi.get(`/recordings/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch recordings:", error);
    toast.error("Could not load your recordings.");
    return [];
  }
};

// New function for voice enrollment
export const enrollVoice = async (formData) => {
  const response = await pipelineApi.post('/enroll', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
// Export the original api instance for use with OAuth/user management


export const generateChatTitle = async (sessionId) => {
  if (!sessionId) return;
  // This is a POST request, even if we don't send a body, to trigger the action
  const response = await pipelineApi.post(`/chats/${sessionId}/title`);
  console.log("Generated chat title response:", response.data);
  return response.data;
};



export const getAnalyticsSummary = async (userId) => {
  if (!userId) return [];
  try {
    const response = await pipelineApi.get(`/analytics/user/${userId}/summary`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics summary:", error);
    toast.error("Could not load analytics summary.");
    return [];
  }
};

export const getDailyAnalytics = async (userId, dateStr) => {
  if (!userId || !dateStr) return null;
  try {
    const response = await pipelineApi.get(`/analytics/user/${userId}/${dateStr}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily analytics for ${dateStr}:`, error);
    toast.error(`Could not load details for ${dateStr}.`);
    return null;
  }
};



export const getTasks = async (userId, status = 'pending') => {
  if (!userId) return [];
  try {
    // The backend expects status as a query parameter
    const response = await pipelineApi.get(`/tasks/user/${userId}`, { params: { status } });
    console.log(`Fetched ${status} tasks:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${status} tasks:`, error);
    toast.error(`Could not load your ${status} tasks.`);
    return [];
  }
};

export const completeTask = async (taskId) => {
  if (!taskId) return;
  try {
    const response = await pipelineApi.post(`/tasks/${taskId}/complete`);
    return response.data;
  } catch (error) {
    console.error(`Failed to complete task ${taskId}:`, error);
    throw error; // Re-throw to be caught by the component
  }
};




export default api;