import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAskAssistantMutation } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { StateBanner } from "@/shared/ui/StateBanner";
import { getRouteForecast } from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import {
	appendAssistantMessages,
	createAssistantThread,
	getActiveAssistantChatId,
	getAssistantThread,
	setActiveAssistantChatId,
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
	const [askError, setAskError] = useState(false);
	const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
	const handledState = useRef<LocState>(null);
	const [askAssistant, askState] = useAskAssistantMutation();

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
		async (q: string, base: AssistantThread) => {
			setAskError(false);
			setPendingQuestion(q);
			try {
				const answer = await askAssistant({
					question: q,
					conversationId: base.id,
				}).unwrap();
				const updated = appendAssistantMessages(base.id, [{ from: "bot", text: answer }]);
				if (updated) openThread(updated);
				setPendingQuestion(null);
			} catch {
				setAskError(true);
			}
		},
		[askAssistant, openThread],
	);

	useEffect(() => {
		if (state && handledState.current === state) return;

		if (state?.reset) {
			handledState.current = state;
			setAskError(false);
			setPendingQuestion(null);
			openThread(createAssistantThread(greeting));
			navigate(location.pathname, { replace: true, state: null });
			return;
		}

		if (state?.chatId) {
			handledState.current = state;
			setAskError(false);
			setPendingQuestion(null);
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

				{askError ? (
					<StateBanner
						variant="error"
						title={t("assist.error")}
						actionLabel={t("states.errorRetry")}
						onAction={() => {
							if (!thread || !pendingQuestion) return;
							void sendQuestion(pendingQuestion, thread);
						}}
					/>
				) : null}

				{askState.isLoading ? (
					<p className={styles["assistant-page__sub"]}>{t("states.loading")}</p>
				) : null}

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
								<span>{m.text}</span>
								{m.from === "bot" ? (
									<div className={styles["assistant-page__refs"]}>
										<button
											type="button"
											className={styles["assistant-page__ref"]}
											onClick={() => navigate(getRouteForecast())}
										>
											{t("assist.linkForecast")}
										</button>
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
