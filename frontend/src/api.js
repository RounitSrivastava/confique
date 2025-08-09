const API_URL = import.meta.env.VITE_BACKEND_URL 
  ? import.meta.env.VITE_BACKEND_URL + '/api' 
  : 'https://confique.onrender.com/api';


export default API_URL;