import { BaseQueryFn, FetchArgs, FetchBaseQueryError, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authHeaderValue, getAccessToken } from "./authTokens";
import { resolveDevFixture } from "./devFixtures";

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

const baseQueryWithFixture: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
	args,
	api,
	extra,
) => {
	const result = await rawBaseQuery(args, api, extra);

	if (result.error?.status === "FETCH_ERROR" && __IS_DEV__) {
		const data = resolveDevFixture(args);
		if (data !== undefined) {
			if (__IS_DEV__) {
				// eslint-disable-next-line no-console
				console.info("[api] backend offline → contract fixtures");
			}
			return { data };
		}
	}

	return result;
};

export const rtkApi = createApi({
	reducerPath: "api",
	tagTypes: ["Today", "Forecast", "Scenarios", "PlanFact", "Operations", "Events", "Sources", "Strategies", "User"],
	baseQuery: baseQueryWithFixture,
	endpoints: () => ({}),
});
