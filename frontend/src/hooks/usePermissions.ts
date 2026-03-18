"use client";

import { useState, useEffect, useCallback } from "react";

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userDataStr = sessionStorage.getItem("user");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.permissions) {
          setPermissions(userData.permissions);
        }
        if (userData.role === "SUPER_ADMIN" || userData.isPlatformAdmin) {
          setIsPlatformAdmin(true);
        }
      } catch (e) {
        console.error("Error parsing user data in usePermissions");
      }
    }
    setLoading(false);
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (isPlatformAdmin) return true;
    return permissions.includes(permission);
  }, [permissions, isPlatformAdmin]);

  const hasAnyPermission = useCallback((perms: string[]) => {
    if (isPlatformAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }, [permissions, isPlatformAdmin]);

  const hasAllPermissions = useCallback((perms: string[]) => {
    if (isPlatformAdmin) return true;
    return perms.every(p => permissions.includes(p));
  }, [permissions, isPlatformAdmin]);

  return { 
    permissions, 
    isPlatformAdmin, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    loading 
  };
}
