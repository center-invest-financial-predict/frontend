import { rtkApi } from "@/shared/api/rtkApi";
import { setAccessToken } from "@/shared/api/authTokens";
import type { AuthResponse, ApiUser, CompanyDto, InnsRequest } from "../model/types/dto/AuthResponse";
import type { RegisterDto, SignInDto } from "../model/types/dto/SignInDto";

const userApi = rtkApi.injectEndpoints({
	endpoints: (build) => ({
		getMe: build.query<ApiUser, void>({
			query: () => "/api/auth/me",
			providesTags: ["User"],
		}),

		register: build.mutation<AuthResponse, RegisterDto>({
			query: (body) => ({
				url: "/api/auth/register",
				method: "POST",
				body,
			}),
			async onQueryStarted(_arg, { queryFulfilled }) {
				const { data } = await queryFulfilled;
				setAccessToken(data.accessToken);
			},
		}),

		signIn: build.mutation<AuthResponse, SignInDto>({
			query: (body) => ({
				url: "/api/auth/login",
				method: "POST",
				body,
			}),
			async onQueryStarted(_arg, { queryFulfilled }) {
				const { data } = await queryFulfilled;
				setAccessToken(data.accessToken);
			},
		}),

		signOut: build.mutation<void, void>({
			query: () => ({
				url: "/api/auth/logout",
				method: "POST",
			}),
		}),

		lookupCompany: build.query<CompanyDto, string>({
			query: (inn) => ({
				url: "/api/companies/lookup",
				params: { inn },
			}),
		}),

		listCompanies: build.query<CompanyDto[], void>({
			query: () => "/api/companies",
			providesTags: ["User"],
		}),

		setMyInns: build.mutation<ApiUser, InnsRequest>({
			query: (body) => ({
				url: "/api/users/me/inns",
				method: "PUT",
				body,
			}),
			invalidatesTags: ["User", "Today", "Forecast", "Operations", "Events", "Sources", "PlanFact", "Strategies"],
		}),
	}),
});

export const {
	useGetMeQuery,
	useLazyGetMeQuery,
	useRegisterMutation,
	useSignInMutation,
	useSignOutMutation,
	useLazyLookupCompanyQuery,
	useListCompaniesQuery,
	useSetMyInnsMutation,
} = userApi;
