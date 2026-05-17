export interface LoginCredentials {
  login: string;
  password: string;
}

export interface VerifyCodeData {
  login: string;
  code: string;
}

export interface LoginResponse {
  id?: string;
  external_id?: string;
  role?: string;
  external_role?: string;
  type_?: string;
  name?: string;
  surname?: string;
  patronymic?: string;
  email?: string;
  faculty?: string;
  login?: string;
  last_login?: string;
  created_at?: string;
  sex?: string;
  study_status?: string;
  degree_level?: string;
  study_group?: string;
  specialization?: string;
  finance?: string;
  form?: string;
  enter_year?: string;
  course?: string;
  department_code?: string;
  detail?: string;
}

export interface VerificationResponse {
  user_id?: string;
  access_token?: string;
  refresh_token?: string;
  detail?: string;
}

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

export interface UserMeResponse {
    id?: string;
    external_id?: string;
    role?: string;
    external_role?: string;
    type_?: string;
    name?: string;
    surname?: string;
    patronymic?: string;
    email?: string;
    faculty?: string;
    login?: string;
    last_login?: string;
    created_at?: string;
    sex?: string;
    study_status?: string;
    degree_level?: string;
    study_group?: string;
    specialization?: string;
    finance?: string;
    form?: string;
    enter_year?: string;
    course?: string;
    department_code?: string;
    detail?: any;
}