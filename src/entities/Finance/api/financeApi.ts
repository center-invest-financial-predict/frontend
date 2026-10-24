import { rtkApi } from "@/shared/api/rtkApi";
import type {
	CalendarDto,
	CreateEventArgs,
	EventsDto,
	ForecastQueryArgs,
	ForecastResultDto,
	OperationsDto,
	OperationsQueryArgs,
	ParseEventsResultDto,
	PlanFactDto,
	RegularOperationDto,
	SavedScenarioDto,
	SourcesDto,
	StrategiesDto,
	TodayDashboardDto,
	UpdateStrategiesArgs,
} from "../model/types";

const financeApi = rtkApi.injectEndpoints({
	endpoints: (build) => ({
		getTodayDashboard: build.query<TodayDashboardDto, void>({
			query: () => "/dashboard/today",
			providesTags: ["Today"],
		}),

		getForecast: build.query<ForecastResultDto, ForecastQueryArgs | void>({
			query: (args) => ({
				url: "/forecast",
				params: args ?? {},
			}),
			providesTags: ["Forecast"],
		}),

		getSavedScenarios: build.query<SavedScenarioDto[], void>({
			query: () => "/forecast/scenarios",
			providesTags: ["Scenarios"],
		}),

		getMyScenarios: build.query<SavedScenarioDto[], void>({
			query: () => "/forecast/scenarios/mine",
			providesTags: ["Scenarios"],
		}),

		saveScenario: build.mutation<SavedScenarioDto, { name: string; params: ForecastQueryArgs }>({
			query: (body) => ({
				url: "/forecast/scenarios",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Scenarios"],
		}),

		renameScenario: build.mutation<SavedScenarioDto, { id: string; name: string }>({
			query: ({ id, name }) => ({
				url: `/forecast/scenarios/${id}`,
				method: "PATCH",
				body: { name },
			}),
			invalidatesTags: ["Scenarios"],
		}),

		getPlanFact: build.query<PlanFactDto, void>({
			query: () => "/plan-fact",
			providesTags: ["PlanFact"],
		}),

		getOperations: build.query<OperationsDto, OperationsQueryArgs | void>({
			query: (args) => ({
				url: "/operations",
				params: {
					dir: args?.dir ?? "all",
					category: args?.category && args.category !== "all" ? args.category : undefined,
				},
			}),
			providesTags: ["Operations"],
		}),

		getRegularOperations: build.query<RegularOperationDto[], void>({
			query: () => "/operations/regular",
			providesTags: ["Operations"],
		}),

		getEvents: build.query<EventsDto, void>({
			query: () => "/events",
			providesTags: ["Events"],
		}),

		getCalendar: build.query<CalendarDto, { year: number; month: number }>({
			query: ({ year, month }) => ({
				url: "/calendar",
				params: { year, month },
			}),
			providesTags: ["Events"],
		}),

		getSources: build.query<SourcesDto, void>({
			query: () => "/sources",
			providesTags: ["Sources"],
		}),

		toggleSource: build.mutation<SourcesDto, { id: string; connected: boolean }>({
			query: ({ id, connected }) => ({
				url: `/sources/${id}`,
				method: "PATCH",
				body: { connected },
			}),
			invalidatesTags: ["Sources"],
		}),

		uploadSourceFile: build.mutation<{ ok: boolean }, FormData>({
			query: (body) => ({
				url: "/sources/upload",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Sources", "Today", "Operations", "Events"],
		}),

		getStrategies: build.query<StrategiesDto, void>({
			query: () => "/strategies",
			providesTags: ["Strategies"],
		}),

		updateStrategies: build.mutation<StrategiesDto, UpdateStrategiesArgs>({
			query: (body) => ({
				url: "/strategies",
				method: "PUT",
				body,
			}),
			invalidatesTags: ["Strategies", "Forecast", "Today"],
		}),

		createEvent: build.mutation<{ id: string }, CreateEventArgs>({
			query: (body) => ({
				url: "/events",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
		}),

		parseEventsFile: build.mutation<ParseEventsResultDto, FormData>({
			query: (body) => ({
				url: "/events/parse",
				method: "POST",
				body,
			}),
		}),

		confirmParsedEvents: build.mutation<{ ok: boolean }, { rows: ParseEventsResultDto["rows"] }>({
			query: (body) => ({
				url: "/events/parse/confirm",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
		}),
	}),
});

export const {
	useGetTodayDashboardQuery,
	useGetForecastQuery,
	useGetSavedScenariosQuery,
	useGetMyScenariosQuery,
	useSaveScenarioMutation,
	useRenameScenarioMutation,
	useGetPlanFactQuery,
	useGetOperationsQuery,
	useGetRegularOperationsQuery,
	useGetEventsQuery,
	useGetCalendarQuery,
	useGetSourcesQuery,
	useToggleSourceMutation,
	useUploadSourceFileMutation,
	useGetStrategiesQuery,
	useUpdateStrategiesMutation,
	useCreateEventMutation,
	useParseEventsFileMutation,
	useConfirmParsedEventsMutation,
} = financeApi;
