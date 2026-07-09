export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  /**
   * When true, every HttpClient call to apiUrl is answered by an in-memory mock
   * (see core/interceptors/mock-api.interceptor.ts) instead of hitting a real backend.
   * Flip to false once your friend's Spring Boot API is ready — see MOCK_TESTING.md.
   */
  useMockApi: false,
};
