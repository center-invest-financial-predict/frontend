import { ASSISTANT_ACTIVE_CHAT, ASSISTANT_CHATS } from "@/shared/consts/localStorage";

export type AssistantRole = "user" | "bot";

export type AssistantMessage = {
	id: string;
	from: AssistantRole;
	text: string;
	refs?: string[];
	at: number;
};

export type AssistantThread = {
	id: string;
	title: string;
	updatedAt: number;
	messages: AssistantMessage[];
};

export const ASSISTANT_CHATS_EVENT = "assistant-chats-changed";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const notify = () => {
	window.dispatchEvent(new Event(ASSISTANT_CHATS_EVENT));
};

export const loadAssistantThreads = (): AssistantThread[] => {
	try {
		const raw = localStorage.getItem(ASSISTANT_CHATS);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as AssistantThread[];
		if (!Array.isArray(parsed)) return [];
		return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
	} catch {
		return [];
	}
};

const persist = (threads: AssistantThread[]) => {
	localStorage.setItem(ASSISTANT_CHATS, JSON.stringify(threads));
	notify();
};

export const getAssistantThread = (id: string): AssistantThread | undefined =>
	loadAssistantThreads().find((t) => t.id === id);

export const getActiveAssistantChatId = (): string | null => localStorage.getItem(ASSISTANT_ACTIVE_CHAT);

export const setActiveAssistantChatId = (id: string | null) => {
	if (id) localStorage.setItem(ASSISTANT_ACTIVE_CHAT, id);
	else localStorage.removeItem(ASSISTANT_ACTIVE_CHAT);
	notify();
};

export const createAssistantThread = (greeting?: string): AssistantThread => {
	const now = Date.now();
	const thread: AssistantThread = {
		id: uid(),
		title: "",
		updatedAt: now,
		messages: greeting
			? [
					{
						id: uid(),
						from: "bot",
						text: greeting,
						at: now,
					},
				]
			: [],
	};
	// Keep only chats with user messages + the new thread
	const kept = loadAssistantThreads().filter((t) => t.messages.some((m) => m.from === "user"));
	persist([thread, ...kept]);
	setActiveAssistantChatId(thread.id);
	return thread;
};

export const saveAssistantThread = (thread: AssistantThread) => {
	const threads = loadAssistantThreads();
	const idx = threads.findIndex((t) => t.id === thread.id);
	const next = [...threads];
	if (idx >= 0) next[idx] = thread;
	else next.unshift(thread);
	persist(next.sort((a, b) => b.updatedAt - a.updatedAt));
};

export const appendAssistantMessages = (
	threadId: string,
	messages: Omit<AssistantMessage, "id" | "at">[],
): AssistantThread | undefined => {
	const threads = loadAssistantThreads();
	const idx = threads.findIndex((t) => t.id === threadId);
	if (idx < 0) return undefined;
	const now = Date.now();
	const added: AssistantMessage[] = messages.map((m, i) => ({
		...m,
		id: uid(),
		at: now + i,
	}));
	const thread = { ...threads[idx], messages: [...threads[idx].messages, ...added], updatedAt: now };
	const firstUser = thread.messages.find((m) => m.from === "user");
	if (firstUser && !thread.title) {
		thread.title = firstUser.text.trim().slice(0, 48);
	}
	threads[idx] = thread;
	persist(threads.sort((a, b) => b.updatedAt - a.updatedAt));
	return thread;
};

export const updateAssistantMessage = (
	threadId: string,
	messageId: string,
	text: string,
): AssistantThread | undefined => {
	const threads = loadAssistantThreads();
	const idx = threads.findIndex((t) => t.id === threadId);
	if (idx < 0) return undefined;
	const thread = {
		...threads[idx],
		messages: threads[idx].messages.map((message) =>
			message.id === messageId ? { ...message, text } : message,
		),
		updatedAt: Date.now(),
	};
	threads[idx] = thread;
	persist(threads.sort((a, b) => b.updatedAt - a.updatedAt));
	return thread;
};

/** Threads that have at least one user message (shown in sidebar history). */
export const listAssistantHistory = (): AssistantThread[] =>
	loadAssistantThreads().filter((t) => t.messages.some((m) => m.from === "user"));

export const titleOfThread = (thread: AssistantThread, fallback: string): string =>
	thread.title.trim() || fallback;
