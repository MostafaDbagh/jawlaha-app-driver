// Ported from model/auth_models/auth_model.dart + profile_model.dart
// Convention example for all models: interface + parseX(json) (fromJson) + xToJson (toJson).

export interface Companies {
  id?: number;
  name?: string;
  companyId?: number;
  empId?: string;
  departmentId?: number;
  costCenterId?: number;
  departmentName?: string;
  departmentCode?: string;
  costCenterName?: string;
  costCenterCode?: string;
  accountType?: string;
  isLeaver?: string;
  leavingDate?: string;
  leaveDateStatus?: string;
}

export function parseCompanies(json: any): Companies {
  return {
    id: json?.id,
    name: json?.name,
    companyId: json?.company_id,
    empId: json?.emp_id?.toString(),
    departmentId: json?.department_id,
    costCenterId: json?.cost_center_id,
    departmentName: json?.department_name,
    departmentCode: json?.department_code,
    costCenterName: json?.cost_center_name,
    costCenterCode: json?.cost_center_code,
    accountType: json?.account_type,
    isLeaver: json?.is_leaver?.toString(),
    leavingDate: json?.leaving_date,
    leaveDateStatus: json?.leave_date_status,
  };
}

export interface User {
  // --- jawlahapp fields (User model / getPublicProfile) ---
  userId?: string;
  username?: string;
  fullName?: string;
  countryCode?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  profileImage?: string | null;
  accountType?: string;
  isActive?: boolean;
  isVerified?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  preferredLanguage?: string;
  timezone?: string;

  // --- common ---
  email?: string;
  createdAt?: string;
  updatedAt?: string;

  // --- legacy/back-compat aliases used by some ported screens ---
  id?: number | string;
  name?: string;
  phone?: string;
  customId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  emailVerifiedAt?: string;
  verified?: number | boolean;
  status?: string;
  nationalInsuranceNumber?: string;
  selectedCompany?: string;
  companies?: Companies[];
}

export function parseUser(json: any): User {
  return {
    userId: json?.user_id,
    username: json?.username,
    fullName: json?.full_name,
    countryCode: json?.country_code,
    phoneNumber: json?.phone_number,
    dateOfBirth: json?.date_of_birth,
    gender: json?.gender,
    profileImage: json?.profile_image,
    accountType: json?.account_type,
    isActive: json?.is_active,
    isVerified: json?.is_verified,
    emailVerified: json?.email_verified,
    phoneVerified: json?.phone_verified,
    preferredLanguage: json?.preferred_language,
    timezone: json?.timezone,
    email: json?.email,
    createdAt: json?.created_at,
    updatedAt: json?.updated_at,

    // Back-compat aliases so existing screens that read `name`/`id`/`phone` still work.
    id: json?.user_id ?? json?.id,
    name: json?.full_name ?? json?.username ?? json?.name,
    phone: json?.phone_number ?? json?.phone,
    verified: json?.is_verified ?? json?.verified,
    companies: Array.isArray(json?.companies) ? json.companies.map(parseCompanies) : undefined,
  };
}

export function userToJson(u: User): any {
  return {
    id: u.id,
    custom_id: u.customId,
    name: u.name,
    first_name: u.firstName,
    middle_name: u.middleName,
    last_name: u.lastName,
    email: u.email,
    phone: u.phone,
    email_verified_at: u.emailVerifiedAt,
    verified: u.verified,
    status: u.status,
    national_insurance_number: u.nationalInsuranceNumber,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
    selected_company: u.selectedCompany,
    account_type: u.accountType,
  };
}

export interface AuthModel {
  success?: boolean;
  token?: string;
  refreshToken?: string;
  user?: User | null;
}

export function parseAuthModel(json: any): AuthModel {
  return {
    success: json?.success,
    // jawlahapp returns access/refresh tokens; older shape used `token`.
    token: json?.accessToken ?? json?.token,
    refreshToken: json?.refreshToken,
    user: json?.user != null ? parseUser(json.user) : null,
  };
}

export interface ProfileModel {
  user?: User | null;
  permissions?: string[];
  countUnread?: number;
}

export function parseProfileModel(json: any): ProfileModel {
  return {
    user: json?.user != null ? parseUser(json.user) : null,
    permissions: Array.isArray(json?.permissions) ? json.permissions : [],
    countUnread: json?.count_unread,
  };
}
