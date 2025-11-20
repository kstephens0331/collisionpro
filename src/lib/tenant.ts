import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cache for shop lookups to reduce DB calls
const shopCache = new Map<string, { id: string; name: string; slug: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get shop by slug with caching
 */
export async function getShopBySlug(slug: string): Promise<{ id: string; name: string; slug: string } | null> {
  // Check cache first
  const cached = shopCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return { id: cached.id, name: cached.name, slug: cached.slug };
  }

  // Fetch from database
  const { data, error } = await supabaseAdmin
    .from("Shop")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  // Cache the result
  shopCache.set(slug, {
    id: data.id,
    name: data.name,
    slug: data.slug,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return data;
}

/**
 * Get shop by ID
 */
export async function getShopById(id: string): Promise<{ id: string; name: string; slug: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("Shop")
    .select("id, name, slug")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Create a tenant-scoped Supabase client
 * This sets the shop context for RLS policies
 */
export function createTenantClient(shopId: string) {
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-shop-id': shopId,
      },
    },
  });

  // Set the shop context for RLS
  // Note: We'll call this as a function before queries
  return {
    client,
    shopId,

    // Helper to set context before queries
    async setContext() {
      await client.rpc('set_shop_context', { shop_id: shopId });
    },

    // Convenience method for queries with context
    async query<T>(
      table: string,
      queryFn: (query: ReturnType<typeof client.from>) => Promise<{ data: T | null; error: any }>
    ): Promise<{ data: T | null; error: any }> {
      await this.setContext();
      return queryFn(client.from(table));
    },
  };
}

/**
 * Generate a URL-safe slug from shop name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string, excludeShopId?: string): Promise<boolean> {
  let query = supabaseAdmin
    .from("Shop")
    .select("id")
    .eq("slug", slug);

  if (excludeShopId) {
    query = query.neq("id", excludeShopId);
  }

  const { data } = await query.single();
  return !data;
}

/**
 * Get unique slug (appends number if needed)
 */
export async function getUniqueSlug(baseName: string, excludeShopId?: string): Promise<string> {
  let slug = generateSlug(baseName);
  let counter = 1;

  while (!(await isSlugAvailable(slug, excludeShopId))) {
    slug = `${generateSlug(baseName)}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Validate shop access for a user
 */
export async function validateUserShopAccess(userId: string, shopId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("id", userId)
    .eq("shopId", shopId)
    .single();

  return !error && !!data;
}

/**
 * Get user's shop
 */
export async function getUserShop(userId: string): Promise<{ id: string; name: string; slug: string } | null> {
  const { data: user, error } = await supabaseAdmin
    .from("User")
    .select("shopId")
    .eq("id", userId)
    .single();

  if (error || !user?.shopId) {
    return null;
  }

  return getShopById(user.shopId);
}

// Type for tenant context
export interface TenantContext {
  shopId: string;
  shopSlug: string;
  shopName: string;
}
