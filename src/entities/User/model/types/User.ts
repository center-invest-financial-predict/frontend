import { UserRoles } from "../consts/UserRoles";

export type DataSourceKind = "ONE_C" | "GOS_SERVICE" | "CSV";

export interface Business {
	inn: string;
	name: string;
	form: string;
	tax: string;
	city: string;
}

export interface UserAssumptions {
	minBalance: string;
	payDay: number;
	notifyApp: boolean;
	notifyMail: boolean;
}

export interface UserProfile {
	business?: Business;
	sources?: DataSourceKind[];
	assumptions?: UserAssumptions;
}

export interface User {
	id: string;
	username: string;
	name?: string;
	avatar?: string;
	roles?: UserRoles[];
}

export interface UserSchema {
	authData?: User;
	onboardingDone: boolean;
	profile?: UserProfile;
	_inited: boolean;
}
