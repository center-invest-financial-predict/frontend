import axios from "axios";
import { authHeaderValue, getAccessToken } from "./authTokens";

export const $api = axios.create({
	baseURL: __API__,
});

$api.interceptors.request.use((config) => {
	const token = getAccessToken();
	if (config.headers && token) {
		config.headers.Authorization = authHeaderValue(token);
	}
	return config;
});
