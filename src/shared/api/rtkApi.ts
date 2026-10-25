import {
	BaseQueryFn,
	FetchArgs,
	FetchBaseQueryError,
	createApi,
	fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { UserActions } from "@/entities/User/model/slice/userSlice";
import {
	authHeaderValue,
	getAccessToken,
	getRefreshToken,
	setAuthSession,
} from "./authTokens";

type AuthTokensResponse = {
	accessToken: string;
	refreshToken?: string;
};

const rawBaseQuery = fetchBaseQuery({
	baseUrl: __API__,
	timeout: 20_000,
	prepareHeaders: (headers) => {
		const token = getAccessToken();
		if (token) {
			headers.set("Authorization", authHeaderValue(token));
		}
		return headers;
	},
});

const slowBaseQuery = fetchBaseQuery({
	baseUrl: __API__,
	timeout: 120_000,
	prepareHeaders: (headers) => {
		const token = getAccessToken();
		if (token) headers.set("Authorization", authHeaderValue(token));
		return headers;
	},
});

const requestUrl = (args: string | FetchArgs): string =>
	typeof args === "string" ? args : args.url;

const isAuthPath = (url: string) =>
	url.includes("/api/auth/login") ||
	url.includes("/api/auth/register") ||
	url.includes("/api/auth/refresh");

const isSlowPath = (url: string) =>
	url.includes("/operations/import/preview") ||
	url.includes("/operations/import/receipt") ||
	url.includes("/assistant/ask");

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async (
	api: Parameters<BaseQueryFn>[1],
	extra: Parameters<BaseQueryFn>[2],
): Promise<boolean> => {
	const refreshToken = getRefreshToken();
	if (!refreshToken) return false;

	const result = await rawBaseQuery(
		{
			url: "/api/auth/refresh",
			method: "POST",
			body: { refreshToken },
		},
		api,
		extra,
	);

	if (result.error || !result.data) return false;

	const data = result.data as AuthTokensResponse;
	if (!data.accessToken) return false;

	setAuthSession(data.accessToken, data.refreshToken);
	return true;
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
	args,
	api,
	extra,
) => {
	const query = isSlowPath(requestUrl(args)) ? slowBaseQuery : rawBaseQuery;
	let result = await query(args, api, extra);

	if (result.error?.status !== 401 || isAuthPath(requestUrl(args))) {
		return result;
	}

	if (!refreshPromise) {
		refreshPromise = refreshAccessToken(api, extra).finally(() => {
			refreshPromise = null;
		});
	}

	const refreshed = await refreshPromise;
	if (refreshed) {
		result = await query(args, api, extra);
	} else {
		api.dispatch(UserActions.logout());
	}

	return result;
};

export const rtkApi = createApi({
	reducerPath: "api",
	tagTypes: ["Today", "Forecast", "Scenarios", "PlanFact", "Operations", "Events", "Sources", "Strategies", "User"],
	baseQuery: baseQueryWithReauth,
	endpoints: () => ({}),
});
