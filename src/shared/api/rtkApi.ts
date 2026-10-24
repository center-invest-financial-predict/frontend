import { BaseQueryFn, FetchArgs, FetchBaseQueryError, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { USER_ACCESS_TOKEN } from "@/shared/consts/localStorage";
import { resolveDevFixture } from "./devFixtures";

const rawBaseQuery = fetchBaseQuery({
	baseUrl: __API__,
	prepareHeaders: (headers) => {
		const token = localStorage.getItem(USER_ACCESS_TOKEN) || "";
		if (token) {
			headers.set("Authorization", token);
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
	tagTypes: ["Today", "Forecast", "Scenarios", "PlanFact", "Operations", "Events", "Sources", "Strategies"],
	baseQuery: baseQueryWithFixture,
	endpoints: () => ({}),
});
