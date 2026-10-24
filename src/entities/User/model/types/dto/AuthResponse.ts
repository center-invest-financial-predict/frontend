import { UserRoles } from "../../consts/UserRoles";

export type ApiUserRole = "USER" | "ADMIN";

export interface ApiUser {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	middleName?: string | null;
	role: ApiUserRole;
	inns?: string[];
	enabled?: boolean;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
	expiresIn: number;
	user: ApiUser;
}

export interface CompanyDto {
	inn: string;
	name: string;
	companyCode?: string;
	legalForm?: string | null;
	industry?: string | null;
}

export interface InnsRequest {
	inns: string[];
}

export const mapApiUserToAuthData = (user: ApiUser) => ({
	id: String(user.id),
	username: user.email,
	name: [user.lastName, user.firstName, user.middleName].filter(Boolean).join(" "),
	roles: [user.role === "ADMIN" ? UserRoles.ADMIN : UserRoles.USER],
});
