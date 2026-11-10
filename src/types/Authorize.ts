export type LoginPayload = {
  identifier: string;
  password: string;
}

export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  phone: string;
}

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
}

export type LoginResult = null;

export type RegisterResult = {
  user_id: string;
  role_id: string;
}

export type Role = {
  name: string;
  permissions: string[];
}

export type OwnerRegistration = {
  business_name: string;
  business_address: string;
  admin_note: string | null;
  status: "pending" | "approved" | "rejected";
}

export type ProfileSession = {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_poi_owner_verified: boolean;

  poi_owner: OwnerRegistration | null;
  role: Role | null;
}
