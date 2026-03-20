import axios from "axios";

const API_BASE = "https://smart-logistics-backend.happyhill-9f60ef5d.centralindia.azurecontainerapps.io/api";
export const ShipmentAPI = {
  list: () => axios.get(API_BASE),
  get: (id) => axios.get(`${API_BASE}/${id}`),
  create: (payload) => axios.post(API_BASE, payload),
  update: (id, payload) => axios.put(`${API_BASE}/${id}`, payload),
  remove: (id) => axios.delete(`${API_BASE}/${id}`),
  getByTracking: (trackingNumber) =>
    axios.get(`${API_BASE}/tracking/${trackingNumber}`),
};