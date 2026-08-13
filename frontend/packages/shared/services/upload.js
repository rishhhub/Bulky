import api from './api.js';

export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await api.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.urls || [];
  },

  deleteImage: async (url) => {
    await api.delete('/uploads/image', {
      params: { url },
    });
  },
};

export default uploadService;
