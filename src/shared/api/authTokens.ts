import { USER_ACCESS_TOKEN } from "@/shared/consts/localStorage";

export const getAccessToken = (): string => localStorage.getItem(USER_ACCESS_TOKEN) || "";

export const setAccessToken = (token: string): void => {
	localStorage.setItem(USER_ACCESS_TOKEN, token);
};

export const clearAccessToken = (): void => {
	localStorage.removeItem(USER_ACCESS_TOKEN);
};

export const authHeaderValue = (token = getAccessToken()): string =>
	token ? `Bearer ${token}` : "";
