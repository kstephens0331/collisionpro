"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface TenantContextType {
  shopId: string;
  shopSlug: string;
  shopName: string;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({
  children,
  initialShop,
}: {
  children: React.ReactNode;
  initialShop?: { id: string; slug: string; name: string };
}) {
  const [tenant, setTenant] = useState<TenantContextType>({
    shopId: initialShop?.id || "",
    shopSlug: initialShop?.slug || "",
    shopName: initialShop?.name || "",
    isLoading: !initialShop,
  });

  // If no initial shop provided, try to get from cookie or URL
  useEffect(() => {
    if (initialShop) {
      setTenant({
        shopId: initialShop.id,
        shopSlug: initialShop.slug,
        shopName: initialShop.name,
        isLoading: false,
      });

      // Store in cookie for persistence
      document.cookie = `shop-slug=${initialShop.slug}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days
      document.cookie = `shop-id=${initialShop.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
    }
  }, [initialShop]);

  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }

  return context;
}

// Hook that returns shopId for API calls
export function useShopId() {
  const { shopId } = useTenant();
  return shopId;
}

// For legacy support - get shop ID from cookie if context not available
export function getShopIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/shop-id=([^;]+)/);
  return match ? match[1] : null;
}

export function getShopSlugFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/shop-slug=([^;]+)/);
  return match ? match[1] : null;
}
