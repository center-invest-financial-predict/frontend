import { getAccessToken, getRefreshToken, setAuthSession } from "@/shared/api/authTokens";
import { getActiveInn } from "@/shared/lib/companyInn";

type AssistantStreamRequest = {
	question: string;
	conversationId?: string;
};

type TokenResponse = {
	accessToken?: string;
	refreshToken?: string;
};

const refreshAccessToken = async (): Promise<string> => {
	const refreshToken = getRefreshToken();
	if (!refreshToken) throw new Error("Authentication expired");
	const response = await fetch(`${__API__}/api/auth/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken }),
	});
	if (!response.ok) throw new Error("Authentication expired");
	const session = (await response.json()) as TokenResponse;
	if (!session.accessToken) throw new Error("Authentication refresh failed");
	setAuthSession(session.accessToken, session.refreshToken);
	return session.accessToken;
};

const requestStream = async (inn: string, body: AssistantStreamRequest, token: string): Promise<Response> =>
	fetch(`${__API__}/api/companies/${encodeURIComponent(inn)}/assistant/stream`, {
		method: "POST",
		headers: {
			Accept: "text/event-stream",
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});

const throwForError = async (response: Response): Promise<never> => {
	const message = await response.text();
	throw new Error(message || `Assistant stream failed (${response.status})`);
};

const emitEvents = (buffer: string, onChunk: (chunk: string) => void): string => {
	const events = buffer.split(/\r?\n\r?\n/);
	const remainder = events.pop() ?? "";
	for (const event of events) {
		const data = event
			.split(/\r?\n/)
			.filter((line) => line.startsWith("data:"))
			.map((line) => line.slice(5).replace(/^ /, ""))
			.join("\n");
		if (data && data !== "[DONE]") onChunk(data);
	}
	return remainder;
};

export const streamAssistantAnswer = async (
	request: AssistantStreamRequest,
	onChunk: (chunk: string) => void,
): Promise<void> => {
	const inn = getActiveInn();
	if (!inn) throw new Error("Company INN is not set");
	let response = await requestStream(inn, request, getAccessToken());
	if (response.status === 401) {
		response = await requestStream(inn, request, await refreshAccessToken());
	}
	if (!response.ok) return throwForError(response);
	if (!response.body) throw new Error("Assistant stream is unavailable");

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		buffer = emitEvents(buffer, onChunk);
	}
	buffer += decoder.decode();
	if (buffer.trim()) emitEvents(`${buffer}\n\n`, onChunk);
};
