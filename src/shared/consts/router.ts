export enum AppRoutes {
	MAIN = "main",
	TODAY = "today",
	FORECAST = "forecast",
	PLAN_FACT = "plan_fact",
	EVENTS = "events",
	CALENDAR = "calendar",
	OPERATIONS = "operations",
	SOURCES = "sources",
	STRATEGIES = "strategies",
	ASSISTANT = "assistant",
	LOGIN = "login",
	REGISTER = "register",
	NOT_FOUND = "not_found",
}

export const getRouteMain = () => "/";
export const getRouteToday = () => "/today";
export const getRouteForecast = () => "/forecast";
export const getRoutePlanFact = () => "/plan-fact";
export const getRouteEvents = () => "/events";
export const getRouteCalendar = () => "/calendar";
export const getRouteOperations = () => "/operations";
export const getRouteSources = () => "/sources";
export const getRouteStrategies = () => "/strategies";
export const getRouteAssistant = () => "/assistant";
export const getRouteLogin = () => "/login";
export const getRouteRegister = () => "/register";
export const getRouteNotFound = () => "*";
