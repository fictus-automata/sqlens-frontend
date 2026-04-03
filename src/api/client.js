import { API_BASE_URL } from '../utils/constants';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const method = options.method || 'GET';
  console.log(`[API REQUEST] ${method} ${url}`, options.body ? JSON.parse(options.body) : '');

  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const duration = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      console.error(`[API ERROR] ${method} ${url} - ${response.status} (${duration}ms)`, errorData);
      throw new ApiError(
        errorData.detail || 'An error occurred while fetching data',
        response.status,
        errorData
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      console.log(`[API SUCCESS] ${method} ${url} - 204 No Content (${duration}ms)`);
      return null;
    }

    const data = await response.json();
    console.log(`[API SUCCESS] ${method} ${url} - ${response.status} (${duration}ms)`, data);
    return data;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`[API NETWORK ERROR] ${method} ${url} - (${duration}ms)`, error.message);
    }
    throw error;
  }
}

export const api = {
  // Queries
  getQueries: (params = {}) => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.append(key, value);
      }
    });
    const queryString = urlParams.toString();
    return request(`/queries${queryString ? `?${queryString}` : ''}`);
  },

  getQuery: (id) => request(`/queries/${id}`),

  createQuery: (data) => request('/queries', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getQueryLineage: (id) => request(`/queries/${id}/lineage`),

  getQueryGraph: (id) => request(`/queries/${id}/graph`),

  // Graph Global
  getGlobalGraph: (sourceName, nodeName, limit = 500) => {
    const params = new URLSearchParams({ limit });
    if (sourceName) params.append('source_name', sourceName);
    if (nodeName) params.append('node_name', nodeName);
    return request(`/graph?${params.toString()}`);
  },

  // Schemas
  getSchemas: (sourceName) => {
    const url = `/schemas${sourceName ? `?source_name=${encodeURIComponent(sourceName)}` : ''}`;
    return request(url);
  },

  getSchema: (id) => request(`/schemas/${id}`),

  createSchema: (data) => request('/schemas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  deleteSchema: (id) => request(`/schemas/${id}`, { method: 'DELETE' }),

  getSchemaSources: () => request('/schemas/sources'),
};
