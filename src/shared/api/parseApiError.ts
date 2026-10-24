type ApiErrorBody = {
	message?: string;
	error?: string;
	fields?: Record<string, string>;
};

const unreachableHint = (raw: string): boolean =>
	/ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR|ECONNREFUSED|ECONNRESET|Failed to fetch|NetworkError|ETIMEDOUT/i.test(
		raw,
	);

export const isApiUnreachableError = (error: unknown): boolean => {
	if (!error || typeof error !== "object") return false;
	const err = error as { status?: number | string; data?: unknown; error?: string };
	if (err.status === "FETCH_ERROR" || err.status === "TIMEOUT_ERROR") return true;
	if (typeof err.error === "string" && unreachableHint(err.error)) return true;
	if (typeof err.data === "string" && unreachableHint(err.data)) return true;
	return false;
};

export const parseApiError = (error: unknown, fallback: string): string => {
	if (!error || typeof error !== "object") return fallback;

	const err = error as { status?: number | string; data?: unknown; error?: string };
	const data = err.data;

	if (isApiUnreachableError(error)) return fallback;

	if (typeof err.error === "string" && err.error.trim() && !unreachableHint(err.error)) {
		return err.error;
	}

	if (typeof data === "string" && data.trim()) {
		if (unreachableHint(data)) return fallback;
		return data;
	}

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
