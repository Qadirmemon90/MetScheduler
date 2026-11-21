import axios from "axios";


const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || ""
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response && error.message === "Network Error") {
            console.error("Backend server connection failed. Ensure the server is running on http://localhost:3000.");
        }
        if(error?.response?.status === 401){
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            delete api.defaults.headers.common["Authorization"];
            if(error.response.data){
                error.response.data.message = "Session expired. Please sign in again.";
            }else{
                error.response.data = { message: "Session expired. Please sign in again." };
            }
            window.dispatchEvent(new Event("auth:unauthorized"));
        }
        return Promise.reject(error);
    },
)

export default api;
