import { LoginDto } from "../types";

export const authService = {
  login: async (credentials: LoginDto) => {
    const formData = new FormData();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);

    const response = await fetch("https://plaintiff-don-larger-spokesman.trycloudflare.com/api/login", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) throw new Error("Login failed");

    const data = await response.json(); 
    
    return data;
  },

  getMe: async () => {
    const response = await fetch("https://plaintiff-don-larger-spokesman.trycloudflare.com/me", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Not authenticated");
    return await response.json();
  },

  logout: async () => {
    await fetch("https://plaintiff-don-larger-spokesman.trycloudflare.com/logout", {
      method: "GET",
      credentials: "include",
    });
  }
};