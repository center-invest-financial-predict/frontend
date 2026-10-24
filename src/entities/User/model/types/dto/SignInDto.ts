export interface SignInDto {
	email: string;
	password: string;
}

export interface RegisterDto {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	middleName?: string;
}
