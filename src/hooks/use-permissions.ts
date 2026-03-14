"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useMemo } from "react";

export type PermissionAction = "VIEW" | "CREATE" | "EDIT" | "DELETE";
export type PermissionPage = 
    | "DASHBOARD" 
    | "TRANSACTIONS" 
    | "LEDGERS" 
    | "CATEGORIES"
    | "GOALS"
    | "MASTERS"
    | "BUDGETS"
    | "RECURRING"
    | "USER_MANAGEMENT" 
    | "ACCESS_CONTROL" 
    | "SYSTEM_AUDIT";

export function usePermissions() {
    const { user } = useAuth();

    const hasPermission = useCallback((section: "CORE" | "ADMIN", page: PermissionPage, action: PermissionAction): boolean => {
        if (!user) return false;
        
        // Admin role bypass
        if (user.role === "Admin") return true;
        
        if (!user.rights) return false;
        
        const right = `${section}_${page}_${action}`;
        return user.rights.includes(right);
    }, [user]);

    const canView = useCallback((section: "CORE" | "ADMIN", page: PermissionPage) => 
        hasPermission(section, page, "VIEW"), [hasPermission]);
        
    const canCreate = useCallback((section: "CORE" | "ADMIN", page: PermissionPage) => 
        hasPermission(section, page, "CREATE"), [hasPermission]);
        
    const canEdit = useCallback((section: "CORE" | "ADMIN", page: PermissionPage) => 
        hasPermission(section, page, "EDIT"), [hasPermission]);
        
    const canDelete = useCallback((section: "CORE" | "ADMIN", page: PermissionPage) => 
        hasPermission(section, page, "DELETE"), [hasPermission]);

    return useMemo(() => ({
        hasPermission,
        canView,
        canCreate,
        canEdit,
        canDelete
    }), [hasPermission, canView, canCreate, canEdit, canDelete]);
}
