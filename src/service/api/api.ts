import axios from "axios";

const api = axios.create({
  baseURL: "https://mandysapi.alejandrofs.com/api", 
  withCredentials: true, 
});

export default api;
