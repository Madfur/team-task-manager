import axios from "axios";

const API = axios.create({
  baseURL: "https://team-task-manager-1-f4l9.onrender.com//api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

// Auth
export const signup = (data) => API.post("/auth/signup", data);
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");

// Projects
export const getProjects = () => API.get("/projects");
export const getProject = (id) => API.get(`/projects/${id}`);
export const createProject = (data) => API.post("/projects", data);
export const updateProject = (id, data) =>
  API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
export const addMember = (projectId, data) =>
  API.post(`/projects/${projectId}/members`, data);
export const removeMember = (projectId, userId) =>
  API.delete(`/projects/${projectId}/members/${userId}`);

// Tasks
export const getTasks = (projectId) =>
  API.get(`/tasks/project/${projectId}`);

export const createTask = (projectId, data) =>
  API.post(`/tasks/project/${projectId}`, data);

export const updateTask = (id, data) =>
  API.put(`/tasks/${id}`, data);

export const deleteTask = (id) =>
  API.delete(`/tasks/${id}`);

// Dashboard
export const getDashboard = () => API.get("/dashboard");

export default API;