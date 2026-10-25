import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { streamAssistantAnswer, useAskAssistantMutation } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { getRouteForecast } from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import {
	appendAssistantMessages,
	createAssistantThread,
	getActiveAssistantChatId,
	getAssistantThread,
	setActiveAssistantChatId,
	updateAssistantMessage,
	type AssistantThread,
} from "@/shared/lib/assistantChats";
import styles from "./AssistantPage.module.scss";

type LocState = { question?: string; reset?: boolean; chatId?: string } | null;

export const AssistantPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const state = (location.state as LocState) || null;
	const [thread, setThread] = useState<AssistantThread | null>(null);
	const [isStreaming, setIsStreaming] = useState(false);
	const handledState = useRef<LocState>(null);
	const [askAssistant] = useAskAssistantMutation();

	const greeting = t("assist.welcome");

	const openThread = useCallback(
		(next: AssistantThread) => {
			setThread(next);
			setActiveAssistantChatId(next.id);
			if (searchParams.get("c") !== next.id) {
				setSearchParams({ c: next.id }, { replace: true });
			}
		},
		[searchParams, setSearchParams],
	);

	const resolveThread = useCallback((): AssistantThread => {
		const fromUrl = searchParams.get("c");
		const activeId = fromUrl || getActiveAssistantChatId();
		if (activeId) {
			const existing = getAssistantThread(activeId);
			if (existing) return existing;
		}
		return createAssistantThread(greeting);
	}, [greeting, searchParams]);

	const sendQuestion = useCallback(
		async (question: string, base: AssistantThread) => {
			const withPlaceholder = appendAssistantMessages(base.id, [
				{ from: "bot", text: "", refs: [t("assist.linkForecast")] },
			]);
			const placeholder = withPlaceholder?.messages[withPlaceholder.messages.length - 1];
			if (!placeholder || !withPlaceholder) return;
			setThread(withPlaceholder);
			setIsStreaming(true);

			let answer = "";
			const update = (text: string) => {
				const updated = updateAssistantMessage(base.id, placeholder.id, text);
				if (updated) setThread(updated);
			};
			try {
				await streamAssistantAnswer({ question, conversationId: base.id }, (chunk) => {
					answer += chunk;
					update(answer);
				});
				if (!answer.trim()) throw new Error("Assistant returned an empty stream");
			} catch {
				try {
					answer = await askAssistant({ question, conversationId: base.id }).unwrap();
					update(answer);
				} catch {
					update(t("assist.fallback"));
				}
			} finally {
				setIsStreaming(false);
			}
		},
		[askAssistant, t],
	);

	useEffect(() => {
		if (state && handledState.current === state) return;

		if (state?.reset) {
			handledState.current = state;
			openThread(createAssistantThread(greeting));
			navigate(location.pathname, { replace: true, state: null });
			return;
		}

		if (state?.chatId) {
			handledState.current = state;
			const existing = getAssistantThread(state.chatId);
			openThread(existing ?? createAssistantThread(greeting));
			navigate(location.pathname, { replace: true, state: null });
			return;
		}

		const q = state?.question?.trim();
		if (q) {
			handledState.current = state;
			const current = resolveThread();
			const withUser = appendAssistantMessages(current.id, [{ from: "user", text: q }]);
			const base = withUser ?? current;
			openThread(base);
			navigate(location.pathname, { replace: true, state: null });
			void sendQuestion(q, base);
			return;
		}

		if (!thread) {
			openThread(resolveThread());
		}
	}, [
		state,
		t,
		navigate,
		location.pathname,
		greeting,
		openThread,
		resolveThread,
		thread,
		sendQuestion,
	]);

	const messages = thread?.messages ?? [];

	return (
		<Page className={styles["assistant-page"]}>
			<div className={styles["assistant-page__inner"]}>
				<div>
					<h1 className={styles["assistant-page__title"]}>{t("assist.title")}</h1>
					<p className={styles["assistant-page__sub"]}>{t("assist.pageHint")}</p>
				</div>

				<div className={styles["assistant-page__thread"]}>
					{messages.map((m) => (
						<div
							key={m.id}
							className={cn(
								styles["assistant-page__row"],
								m.from === "user" ? styles["assistant-page__row--user"] : styles["assistant-page__row--bot"],
							)}
						>
							<div
								className={cn(
									styles["assistant-page__bubble"],
									m.from === "user" ? styles["assistant-page__bubble--user"] : styles["assistant-page__bubble--bot"],
								)}
							>
								<span>
									{m.text ||
										(isStreaming && m.from === "bot" && m.id === messages[messages.length - 1]?.id
											? t("states.loading")
											: "")}
								</span>
								{m.refs?.length ? (
									<div className={styles["assistant-page__refs"]}>
										{m.refs.map((ref) => (
											<button
												key={ref}
												type="button"
												className={styles["assistant-page__ref"]}
												onClick={() => navigate(getRouteForecast())}
											>
												{ref}
											</button>
										))}
									</div>
								) : null}
							</div>
						</div>
					))}
				</div>
			</div>
		</Page>
	);
});

export default AssistantPage;
