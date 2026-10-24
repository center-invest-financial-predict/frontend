import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authHeaderValue, getAccessToken } from "./authTokens";

export const rtkApi = createApi({
	reducerPath: "api",
	tagTypes: ["Today", "Forecast", "Scenarios", "PlanFact", "Operations", "Events", "Sources", "Strategies", "User"],
	baseQuery: fetchBaseQuery({
		baseUrl: __API__,
		timeout: 20_000,
		prepareHeaders: (headers) => {
			const token = getAccessToken();
			if (token) {
				headers.set("Authorization", authHeaderValue(token));
			}
			return headers;
		},
	}),
	endpoints: () => ({}),
});
