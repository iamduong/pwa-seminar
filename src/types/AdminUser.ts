export interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    is_poi_owner_verified: boolean;
    role_id: string | null;
    role_name: string | null;
}

export interface AdminUserRoleOption {
    id: string;
    name: string;
}

export interface FilterAdminUser {
    page: number;
    page_size: number;
    q?: string;
    is_active?: boolean;
    is_poi_owner_verified?: boolean;
}

export interface AdminUserPagination {
    page: number;
    page_size: number;
    total_item: number;
    total_page: number;
    data: AdminUser[];
}
