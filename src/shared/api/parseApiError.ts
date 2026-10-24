type ApiErrorBody = {
	message?: string;
	error?: string;
	fields?: Record<string, string>;
};

export const parseApiError = (error: unknown, fallback: string): string => {
	if (!error || typeof error !== "object") return fallback;

	const err = error as { status?: number | string; data?: unknown };
	const data = err.data;

	if (typeof data === "string" && data.trim()) return data;

	if (data && typeof data === "object") {
		const body = data as ApiErrorBody;
		if (body.fields && Object.keys(body.fields).length) {
			return Object.values(body.fields).join(". ");
		}
		if (body.message) return body.message;
		if (body.error) return body.error;
	}

	if (err.status === 401) return fallback;
	return fallback;
};
