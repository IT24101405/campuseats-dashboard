const configuredUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
export const apiUrl = configuredUrl === "https://api.example.invalid" ? "" : configuredUrl;
export const menuUrl = apiUrl ? `${apiUrl}/api/menu` : "/menu.json";
