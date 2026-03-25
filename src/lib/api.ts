const API_BASE = `http://${window.location.hostname}:3000/api`;

export const api = {
  get: async (endpoint: string): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return await res.json();
    } catch(err) {
      console.error(err);
      return [];
    }
  },
  post: async (endpoint: string, body: any): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return await res.json();
    } catch(err) {
      console.error(err);
      return null;
    }
  },
  put: async (endpoint: string, body: any): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return await res.json();
    } catch(err) {
      console.error(err);
      return null;
    }
  },
  delete: async (endpoint: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
    } catch(err) {
      console.error(err);
    }
  }
};
