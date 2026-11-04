export interface AdminUser {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    is_poi_owner_verified: boolean;
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
