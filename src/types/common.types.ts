/**
 * Common TypeScript types and enums for the application
 */

// HTTP Status Codes Enum
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// User Roles Enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Environment Types
export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

// API Response Interface (Generic)
export interface ApiResponse<T = unknown> {
  message: string;
  statusCode: HttpStatus;
  success: boolean;
  data?: T;
}

// Error Response Interface
export interface ErrorResponse {
  message: string;
  statusCode: HttpStatus;
  success: false;
  errors: ValidationError[];
  stack?: string;
}

// Validation Error
export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

// Pagination Interface
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request with User
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

// JWT Payload
export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// Token Pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
