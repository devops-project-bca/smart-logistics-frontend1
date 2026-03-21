import axios from "axios";

const API_BASE = "https://smart-logistics-backend.happyhill-9f60ef5d.centralindia.azurecontainerapps.io/api";
export const ShipmentAPI = {
  list: () => axios.get(`${API_BASE}/shipments`),
  get: (id) => axios.get(`${API_BASE}/shipments/${id}`),
  create: (payload) => axios.post(`${API_BASE}/shipments`, payload),
  update: (id, payload) => axios.put(`${API_BASE}/shipments/${id}`, payload),
  remove: (id) => axios.delete(`${API_BASE}/shipments/${id}`),
  getByTracking: (trackingNumber) =>
    axios.get(`${API_BASE}/shipments/tracking/${trackingNumber}`),
};