import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { getRouteToday } from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import {
	appendAssistantMessages,
	createAssistantThread,
	getActiveAssistantChatId,
	getAssistantThread,
	setActiveAssistantChatId,
	type AssistantMessage,
	type AssistantThread,
} from "@/shared/lib/assistantChats";
import styles from "./AssistantPage.module.scss";

const replyFor = (q: string, t: (k: string) => string): Omit<AssistantMessage, "id" | "at"> => {
	const lower = q.toLowerCase();
	if (lower.includes("дельт") || lower.includes("задерж")) {
		return {
			from: "bot",
			text: t("assist.a2"),
			refs: [t("assist.link1"), t("assist.link2")],
		};
	}
	return {
		from: "bot",
		text: t("assist.a1"),
		refs: [t("assist.link1")],
	};
};

type LocState = { question?: string; reset?: boolean; chatId?: string } | null;

export const AssistantPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const state = (location.state as LocState) || null;
	const [thread, setThread] = useState<AssistantThread | null>(null);
	const handledState = useRef<LocState>(null);

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
			const updated = appendAssistantMessages(current.id, [{ from: "user", text: q }, replyFor(q, t)]);
			openThread(updated ?? current);
			navigate(location.pathname, { replace: true, state: null });
			return;
		}

		if (!thread) {
			openThread(resolveThread());
		}
	}, [state, t, navigate, location.pathname, greeting, openThread, resolveThread, thread]);

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
								<span>{m.text}</span>
								{m.refs?.length ? (
									<div className={styles["assistant-page__refs"]}>
										{m.refs.map((ref) => (
											<button
												key={ref}
												type="button"
												className={styles["assistant-page__ref"]}
												onClick={() => navigate(getRouteToday())}
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
