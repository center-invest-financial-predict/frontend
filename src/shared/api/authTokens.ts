import { USER_ACCESS_TOKEN, USER_REFRESH_TOKEN } from "@/shared/consts/localStorage";

export const getAccessToken = (): string => localStorage.getItem(USER_ACCESS_TOKEN) || "";

export const getRefreshToken = (): string => localStorage.getItem(USER_REFRESH_TOKEN) || "";

export const setAccessToken = (token: string): void => {
	localStorage.setItem(USER_ACCESS_TOKEN, token);
};

export const setRefreshToken = (token: string): void => {
	localStorage.setItem(USER_REFRESH_TOKEN, token);
};

export const setAuthSession = (accessToken: string, refreshToken?: string): void => {
	setAccessToken(accessToken);
	if (refreshToken) {
		setRefreshToken(refreshToken);
	}
};

export const clearAccessToken = (): void => {
	localStorage.removeItem(USER_ACCESS_TOKEN);
};

export const clearAuthTokens = (): void => {
	localStorage.removeItem(USER_ACCESS_TOKEN);
	localStorage.removeItem(USER_REFRESH_TOKEN);
};

export const authHeaderValue = (token = getAccessToken()): string =>
	token ? `Bearer ${token}` : "";
