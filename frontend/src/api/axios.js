import axios from "axios";   //Imports the axios library for making HTTP requests.

// creates a custom axios instance with predefined configuration.

const api = axios.create({
  baseURL: "http://localhost:5000/api",

  // sets the base URL for all requests made using this instance
  // so /auth/signup becomes http://localhost:5000/api/auth/signup
});



// Attach token automatically to every request.

// request interceptor : runs before request is sent.
// response interceptor : runs after response is received.

api.interceptors.request.use(

  // config is an object containing all request details.
  // It contains method, url, baseURL, headers, params etc.

  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;