import axios from "axios";

const API_BASE = "https://smart-logistics-backend.happyhill-9f60ef5d.centralindia.azurecontainerapps.io/api";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    return Promise.reject(error);
  }
);

export const ShipmentAPI = {
  list: () => axiosInstance.get("/shipments"),
  get: (id) => axiosInstance.get(`/shipments/${id}`),
  create: (payload) => {
    console.log("Create request with payload:", JSON.stringify(payload, null, 2));
    return axiosInstance.post("/shipments", payload);
  },
  update: (id, payload) => {
    console.log("Update request for id:", id, "with payload:", JSON.stringify(payload, null, 2));
    return axiosInstance.put(`/shipments/${id}`, payload);
  },
  remove: (id) => axiosInstance.delete(`/shipments/${id}`),
  getByTracking: (trackingNumber) =>
    axiosInstance.get(`/shipments/tracking/${trackingNumber}`),
};