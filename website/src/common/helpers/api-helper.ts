import axios, { AxiosResponse } from 'axios';

export abstract class ApiHelper {
  static async get<T>(path: string): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await axios.get('/api/' + path);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('Unauthorized');
        window.location.href = '/login';
        return null;
      }
      if ((error.response?.status >= 500 && error.response?.status < 600) || error.code === 'ERR_CONNECTION_REFUSED') {
        console.log('Unable to connect to server');
        window.location.href = '/#/system-unavailable';
        return null;
      }
      console.error('Error getting api ' + path + ':', error);
      return null;
    }
  }

  static async post<T>(path: string, data: unknown): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await axios.post('/api/' + path, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('Unauthorized');
        window.location.href = '/login';
        return null;
      }
      if ((error.response?.status >= 500 && error.response?.status < 600) || error.code === 'ERR_CONNECTION_REFUSED') {
        console.log('Unable to connect to server');
        window.location.href = '/#/system-unavailable';
        return null;
      }
      console.error('Error posting to api ' + path + ':', error);
      return null;
    }
  }
}