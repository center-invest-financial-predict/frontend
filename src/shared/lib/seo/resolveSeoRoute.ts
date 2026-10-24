import {
	getRouteAdd,
	getRouteAssistant,
	getRouteCalendar,
	getRouteEvents,
	getRouteForecast,
	getRouteLogin,
	getRouteMain,
	getRouteOnboarding,
	getRouteOperations,
	getRoutePlanFact,
	getRouteRegister,
	getRouteSettings,
	getRouteSources,
	getRouteStrategies,
	getRouteToday,
} from "@/shared/consts/router";

export type SeoRouteKey =
	| "today"
	| "forecast"
	| "plan_fact"
	| "events"
	| "calendar"
	| "add"
	| "operations"
	| "sources"
	| "strategies"
	| "settings"
	| "assistant"
	| "login"
	| "register"
	| "onboarding"
	| "not_found";

const EXACT: Record<string, SeoRouteKey> = {
	[getRouteMain()]: "today",
	[getRouteToday()]: "today",
	[getRouteForecast()]: "forecast",
	[getRoutePlanFact()]: "plan_fact",
	[getRouteEvents()]: "events",
	[getRouteCalendar()]: "calendar",
	[getRouteAdd()]: "add",
	[getRouteOperations()]: "operations",
	[getRouteSources()]: "sources",
	[getRouteStrategies()]: "strategies",
	[getRouteSettings()]: "settings",
	[getRouteAssistant()]: "assistant",
	[getRouteLogin()]: "login",
	[getRouteRegister()]: "register",
	[getRouteOnboarding()]: "onboarding",
};

/** App / auth flows that should not be indexed. */
const NO_INDEX: SeoRouteKey[] = [
	"login",
	"register",
	"onboarding",
	"settings",
	"assistant",
	"not_found",
];

export const resolveSeoRoute = (pathname: string): SeoRouteKey =>
	EXACT[pathname] || "not_found";

export const isNoIndexRoute = (key: SeoRouteKey) => NO_INDEX.includes(key);
