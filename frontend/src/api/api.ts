//frontend/src/api/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // IMPORTANT: send cookies (passport session)
});

export default api;