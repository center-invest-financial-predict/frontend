import { NotFoundPage } from "@/pages/NotFoundPage";
import { LazyTodayPage } from "@/pages/TodayPage";
import { ForecastPage } from "@/pages/ForecastPage";
import { PlanFactPage } from "@/pages/PlanFactPage";
import { EventsPage } from "@/pages/EventsPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { OperationsPage } from "@/pages/OperationsPage";
import { SourcesPage } from "@/pages/SourcesPage";
import { StrategiesPage } from "@/pages/StrategiesPage";
import { AssistantPage } from "@/pages/AssistantPage";
import {
	AppRoutes,
	getRouteCalendar,
	getRouteEvents,
	getRouteForecast,
	getRouteLogin,
	getRouteMain,
	getRouteNotFound,
	getRouteOperations,
	getRoutePlanFact,
	getRouteRegister,
	getRouteSources,
	getRouteStrategies,
	getRouteToday,
	getRouteAssistant,
} from "@/shared/consts/router";
import { AppRouteProps } from "@/shared/types/router";
import { LazyLoginPage } from "@/pages/Login";
import { LazyRegisterPage } from "@/pages/Register";

export const routeConfig: Record<AppRoutes, AppRouteProps> = {
	[AppRoutes.MAIN]: {
		path: getRouteMain(),
		element: <LazyTodayPage />,
	},
	[AppRoutes.TODAY]: {
		path: getRouteToday(),
		element: <LazyTodayPage />,
	},
	[AppRoutes.FORECAST]: {
		path: getRouteForecast(),
		element: <ForecastPage />,
	},
	[AppRoutes.PLAN_FACT]: {
		path: getRoutePlanFact(),
		element: <PlanFactPage />,
	},
	[AppRoutes.EVENTS]: {
		path: getRouteEvents(),
		element: <EventsPage />,
	},
	[AppRoutes.CALENDAR]: {
		path: getRouteCalendar(),
		element: <CalendarPage />,
	},
	[AppRoutes.OPERATIONS]: {
		path: getRouteOperations(),
		element: <OperationsPage />,
	},
	[AppRoutes.SOURCES]: {
		path: getRouteSources(),
		element: <SourcesPage />,
	},
	[AppRoutes.STRATEGIES]: {
		path: getRouteStrategies(),
		element: <StrategiesPage />,
	},
	[AppRoutes.ASSISTANT]: {
		path: getRouteAssistant(),
		element: <AssistantPage />,
	},
	[AppRoutes.LOGIN]: {
		path: getRouteLogin(),
		element: <LazyLoginPage />,
	},
	[AppRoutes.REGISTER]: {
		path: getRouteRegister(),
		element: <LazyRegisterPage />,
	},
	[AppRoutes.NOT_FOUND]: {
		path: getRouteNotFound(),
		element: <NotFoundPage />,
	},
};
