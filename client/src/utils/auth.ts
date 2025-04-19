// Cookie utility functions for auth

// Set auth token in cookie
export const setAuthCookie = (token: string) => {
  // Store in localStorage for easy access
  localStorage.setItem("token", token);

  // Also set in cookie for middleware
  document.cookie = `token=${token}; path=/; max-age=${
    7 * 24 * 60 * 60
  }; SameSite=Lax`;
};

// Remove auth token from cookie
export const removeAuthCookie = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Delete the cookie by setting max-age to 0
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
};

// Get token from cookies
export const getTokenFromCookie = (): string | null => {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith("token=")) {
      return cookie.substring("token=".length, cookie.length);
    }
  }
  return null;
};

// Parse JWT token to get user info
export const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    console.error("Error parsing JWT token:", e);
    return null;
  }
};
