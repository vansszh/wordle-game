import type { User } from "@supabase/supabase-js";

// Pulls the display name + avatar from a Supabase auth user. The keys depend
// on the OAuth provider (Google uses `full_name` + `picture`, others vary).
export function profileFromAuthUser(user: User): {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
} {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const pick = (...keys: string[]): string | null => {
    if (!meta) return null;
    for (const k of keys) {
      const v = meta[k];
      if (typeof v === "string" && v.length > 0) return v;
    }
    return null;
  };
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: pick("full_name", "name"),
    avatarUrl: pick("avatar_url", "picture"),
  };
}
