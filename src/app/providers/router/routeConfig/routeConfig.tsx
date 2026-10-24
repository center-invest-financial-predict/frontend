import { NotFoundPage } from "@/pages/NotFoundPage";
import { LazyTodayPage } from "@/pages/TodayPage";
import { ForecastPage } from "@/pages/ForecastPage";
import { PlanFactPage } from "@/pages/PlanFactPage";
import { EventsPage } from "@/pages/EventsPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { OperationsPage } from "@/pages/OperationsPage";
import { SourcesPage } from "@/pages/SourcesPage";
import { AddPage } from "@/pages/AddPage";
import { StrategiesPage } from "@/pages/StrategiesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AssistantPage } from "@/pages/AssistantPage";
import { FaqPage } from "@/pages/FaqPage";
import {
	AppRoutes,
	getRouteAdd,
	getRouteCalendar,
	getRouteEvents,
	getRouteForecast,
	getRouteFaq,
	getRouteLogin,
	getRouteMain,
	getRouteNotFound,
	getRouteOnboarding,
	getRouteOperations,
	getRoutePlanFact,
	getRouteRegister,
	getRouteSources,
	getRouteStrategies,
	getRouteSettings,
	getRouteToday,
	getRouteAssistant,
} from "@/shared/consts/router";
import { AppRouteProps } from "@/shared/types/router";
import { LazyLoginPage } from "@/pages/Login";
import { LazyRegisterPage } from "@/pages/Register";
import { LazyOnboardingPage } from "@/pages/Onboarding";

export const routeConfig: Record<AppRoutes, AppRouteProps> = {
	[AppRoutes.MAIN]: {
		path: getRouteMain(),
		element: <LazyTodayPage />,
		authOnly: true,
	},
	[AppRoutes.TODAY]: {
		path: getRouteToday(),
		element: <LazyTodayPage />,
		authOnly: true,
	},
	[AppRoutes.FORECAST]: {
		path: getRouteForecast(),
		element: <ForecastPage />,
		authOnly: true,
	},
	[AppRoutes.PLAN_FACT]: {
		path: getRoutePlanFact(),
		element: <PlanFactPage />,
		authOnly: true,
	},
	[AppRoutes.EVENTS]: {
		path: getRouteEvents(),
		element: <EventsPage />,
		authOnly: true,
	},
	[AppRoutes.CALENDAR]: {
		path: getRouteCalendar(),
		element: <CalendarPage />,
		authOnly: true,
	},
	[AppRoutes.ADD]: {
		path: getRouteAdd(),
		element: <AddPage />,
		authOnly: true,
	},
	[AppRoutes.OPERATIONS]: {
		path: getRouteOperations(),
		element: <OperationsPage />,
		authOnly: true,
	},
	[AppRoutes.SOURCES]: {
		path: getRouteSources(),
		element: <SourcesPage />,
		authOnly: true,
	},
	[AppRoutes.STRATEGIES]: {
		path: getRouteStrategies(),
		element: <StrategiesPage />,
		authOnly: true,
	},
	[AppRoutes.SETTINGS]: {
		path: getRouteSettings(),
		element: <SettingsPage />,
		authOnly: true,
	},
	[AppRoutes.ASSISTANT]: {
		path: getRouteAssistant(),
		element: <AssistantPage />,
		authOnly: true,
	},
	[AppRoutes.FAQ]: {
		path: getRouteFaq(),
		element: <FaqPage />,
		authOnly: true,
	},
	[AppRoutes.LOGIN]: {
		path: getRouteLogin(),
		element: <LazyLoginPage />,
	},
	[AppRoutes.REGISTER]: {
		path: getRouteRegister(),
		element: <LazyRegisterPage />,
	},
	[AppRoutes.ONBOARDING]: {
		path: getRouteOnboarding(),
		element: <LazyOnboardingPage />,
		authOnly: true,
	},
	[AppRoutes.NOT_FOUND]: {
		path: getRouteNotFound(),
		element: <NotFoundPage />,
	},
};
