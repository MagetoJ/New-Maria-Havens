// API configuration and utilities for frontend-backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Common types
type RequestData = Record<string, unknown> | FormData | null;
export type PaginatedResponse<T> = {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
};

export type MenuItemData = {
  name: string;
  description: string;
  price: number;
  category: number;
  is_available: boolean;
  ingredients?: string;
  image?: string;
  prep_time?: number;
  availability_status?: string;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  is_available: boolean;
  ingredients?: string;
  image?: string;
  prep_time?: number;
  availability_status?: string;
  popularity?: number;
};

export type OrderData = {
  table: number;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  special_instructions?: string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery';
  status?: string;
  items: Array<{
    item: number;
    quantity: number;
    notes?: string;
  }>;
};

type ReservationData = {
  customer: number;
  date: string;
  time: string;
  party_size: number;
  notes?: string;
};

export type BookingData = {
  customer: number;
  room: number;
  check_in: string;
  check_out: string;
  guests: number;
  notes?: string;
};

type PaymentData = {
  order: number;
  amount: number;
  method: string;
};

type TableData = {
  number: number;
  seats: number;
  status: string;
  notes?: string;
};

// API client class to handle all backend communication
class APIClient {
  private baseURL: string;
  private csrfToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Get CSRF token from Django
  private async getCSRFToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      await fetch(`${this.baseURL.replace('/api', '')}/admin/`, {
        credentials: 'include',
      });
      const cookies = document.cookie.split(';');
      const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
      if (csrfCookie) {
        this.csrfToken = csrfCookie.split('=')[1];
        return this.csrfToken;
      }
    } catch (error) {
      console.warn('Could not fetch CSRF token:', error);
    }
    
    return '';
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add CSRF token for non-GET requests
    if (options.method && options.method !== 'GET') {
      const csrfToken = await this.getCSRFToken();
      if (csrfToken) {
        defaultHeaders['X-CSRFToken'] = csrfToken;
      }
    }

    const config: RequestInit = {
      credentials: 'include', // Include cookies for session auth
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as unknown as T;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: RequestData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: RequestData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: RequestData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create and export API client instance
export const apiClient = new APIClient(API_BASE_URL);

// User-related API functions
export const userAPI = {
  // Login user
  login: async (email: string, password: string) => {
    return apiClient.post<{
      message: string;
      user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
        status: string;
        last_login: string;
        date_joined: string;
      };
      session_key: string;
    }>('/accounts/login/', { email, password });
  },

  // Logout user
  logout: async () => {
    return apiClient.post<{ message: string }>('/accounts/logout/');
  },

  // Get current user profile
  getProfile: async () => {
    return apiClient.get('/accounts/profile/');
  },

  // Get dashboard stats (admin only)
  getDashboardStats: async () => {
    return apiClient.get('/accounts/dashboard-stats/');
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string, newPasswordConfirm: string) => {
    return apiClient.post('/accounts/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    return apiClient.post('/accounts/forgot-password/', { email });
  },
};

// Menu-related API functions
export const menuAPI = {
  // Get all categories
  getCategories: async () => {
    return apiClient.get('/menu/categories/');
  },

  // Get all menu items
  getMenuItems: async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get(`/menu/items/${queryString}`);
  },

  // Get featured menu items
  getFeaturedItems: async () => {
    return apiClient.get('/menu/items/featured/');
  },

  // Get menu statistics
  getMenuStats: async () => {
    return apiClient.get('/menu/stats/');
  },

  // Create menu item
  createMenuItem: async (itemData: MenuItemData) => {
    return apiClient.post('/menu/items/', itemData);
  },

  // Update menu item
  updateMenuItem: async (id: number, itemData: Partial<MenuItemData>) => {
    return apiClient.patch(`/menu/items/${id}/`, itemData);
  },

  // Delete menu item
  deleteMenuItem: async (id: number) => {
    return apiClient.delete(`/menu/items/${id}/`);
  },
};

// Order-related API functions
export const orderAPI = {
  // Get all tables
  getTables: async () => {
    return apiClient.get('/orders/tables/');
  },

  // Get all orders
  getOrders: async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get(`/orders/orders/${queryString}`);
  },

  // Create new order
  createOrder: async (orderData: OrderData) => {
    return apiClient.post('/orders/orders/', orderData);
  },

  // Update order
  updateOrder: async (id: number, orderData: Partial<OrderData>) => {
    return apiClient.patch(`/orders/orders/${id}/`, orderData);
  },

  // Get order statistics
  getOrderStats: async () => {
    return apiClient.get('/orders/stats/');
  },

  // Process payment
  processPayment: async (paymentData: PaymentData) => {
    return apiClient.post('/orders/payments/', paymentData);
  },
};

// Reservation-related API functions
export const reservationAPI = {
  // Get all customers
  getCustomers: async () => {
    return apiClient.get('/reservations/customers/');
  },

  // Get all reservations
  getReservations: async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get(`/reservations/reservations/${queryString}`);
  },

  // Create reservation
  createReservation: async (reservationData: ReservationData) => {
    return apiClient.post('/reservations/reservations/', reservationData);
  },

  // Update reservation
  updateReservation: async (id: number, reservationData: Partial<ReservationData>) => {
    return apiClient.patch(`/reservations/reservations/${id}/`, reservationData);
  },

  // Get availability
  checkAvailability: async (date: string, time: string, partySize: number) => {
    return apiClient.get(`/reservations/availability/?date=${date}&time=${time}&party_size=${partySize}`);
  },
};

// Orders and Tables API functions
export const ordersAPI = {
  // Get all tables
  getTables: async () => {
    return apiClient.get('/orders/tables/');
  },

  // Create table
  createTable: async (tableData: TableData) => {
    return apiClient.post('/orders/tables/', tableData);
  },

  // Update table
  updateTable: async (id: number, tableData: Partial<TableData>) => {
    return apiClient.patch(`/orders/tables/${id}/`, tableData);
  },

  // Get all orders
  getOrders: async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get(`/orders/orders/${queryString}`);
  },

  // Create order
  createOrder: async (orderData: OrderData) => {
    return apiClient.post('/orders/orders/', orderData);
  },

  // Update order
  updateOrder: async (id: number, orderData: Partial<OrderData>) => {
    return apiClient.patch(`/orders/orders/${id}/`, orderData);
  },

  // Get order by id
  getOrder: async (id: number) => {
    return apiClient.get(`/orders/orders/${id}/`);
  },

  // Confirm order
  confirmOrder: async (id: number) => {
    return apiClient.post(`/orders/orders/${id}/confirm/`);
  },

  // Cancel order
  cancelOrder: async (id: number) => {
    return apiClient.post(`/orders/orders/${id}/cancel/`);
  },

  // Serve order
  serveOrder: async (id: number) => {
    return apiClient.post(`/orders/orders/${id}/serve/`);
  },

  // Complete order
  completeOrder: async (id: number) => {
    return apiClient.post(`/orders/orders/${id}/complete/`);
  },

  // Get order items
  getOrderItems: async (orderId: number) => {
    return apiClient.get(`/orders/orders/${orderId}/items/`);
  },

  // Add item to order
  addOrderItem: async (orderData: RequestData) => {
    return apiClient.post('/orders/order-items/', orderData);
  },

  // Update order item
  updateOrderItem: async (id: number, itemData: RequestData) => {
    return apiClient.patch(`/orders/order-items/${id}/`, itemData);
  },

  // Remove order item
  removeOrderItem: async (id: number) => {
    return apiClient.delete(`/orders/order-items/${id}/`);
  },

  // Kitchen display
  getKitchenDisplay: async () => {
    return apiClient.get('/orders/kitchen-display/');
  },

  // Get payments for order
  getPayments: async (orderId: number) => {
    return apiClient.get(`/orders/orders/${orderId}/payments/`);
  },

  // Create payment
  createPayment: async (paymentData: RequestData) => {
    return apiClient.post('/orders/payments/', paymentData);
  },
};

// Hotel-related API functions
export const hotelAPI = {
  // Get all room types
  getRoomTypes: async () => {
    return apiClient.get('/hotels/room-types/');
  },

  // Get all rooms
  getRooms: async () => {
    return apiClient.get('/hotels/rooms/');
  },

  // Get all bookings
  getBookings: async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get(`/hotels/bookings/${queryString}`);
  },

  // Create booking
  createBooking: async (bookingData: BookingData) => {
    return apiClient.post('/hotels/bookings/', bookingData);
  },

  // Check room availability
  checkRoomAvailability: async (checkIn: string, checkOut: string, guests: number) => {
    return apiClient.get(`/hotels/rooms/availability/?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
  },
};

// Export types for TypeScript
export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  status: string;
  phone_number?: string;
  employee_id?: string;
  hire_date?: string;
  profile_picture?: string;
  last_login?: string;
  date_joined: string;
  is_staff: boolean;
  is_active: boolean;
};

export type LoginResponse = {
  message: string;
  user: User;
  session_key: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
};

// Additional response types for specific API endpoints
export type PaginatedApiResponse<T> = {
  data: {
    results: T[];
    count: number;
    next: string | null;
    previous: string | null;
  };
} & Omit<ApiResponse<T[]>, 'data'>;

export type SimpleApiResponse<T> = {
  data: T;
} & Omit<ApiResponse<T>, 'data'>;

// Category type
export type Category = {
  id: number;
  name: string;
  description?: string;
};

// Table type
export type Table = {
  id: number;
  number: number;
  seats: number;
  status: string;
  notes?: string;
};