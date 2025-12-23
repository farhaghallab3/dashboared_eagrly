
export interface DecodedToken {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id?: number;
  id?: number;
  sub?: string | number;
  [key: string]: any;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    
    // Normalize user_id: SimpleJWT uses 'user_id', others might use 'id' or 'sub'
    if (!decoded.user_id) {
        if (decoded.id) decoded.user_id = decoded.id;
        else if (decoded.sub && !isNaN(Number(decoded.sub))) decoded.user_id = Number(decoded.sub);
    }
    
    return decoded;
  } catch (error) {
    console.error("Token decoding failed:", error);
    return null;
  }
};

/**
 * Returns true if token payload contains admin-like claims.
 * Checks common claim names used by backends: `role === 'admin'`, `is_staff`, `is_superuser`.
 */
export const isTokenAdmin = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return false;
  const role = decoded.role || decoded.user_role || decoded.roles || null;
  if (role && String(role).toLowerCase() === 'admin') return true;
  if (decoded.is_staff === true || decoded.is_superuser === true) return true;
  return false;
};
