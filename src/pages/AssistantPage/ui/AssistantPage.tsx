import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { getRouteToday } from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./AssistantPage.module.scss";

type Msg = {
	from: "user" | "bot";
	text: string;
	refs?: string[];
};

const DEFAULT_THREAD: Msg[] = [
	{
		from: "bot",
		text: "Спросите про деньги: остаток, платежи, сценарии.",
	},
];

const replyFor = (q: string, t: (k: string) => string): Msg => {
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

type LocState = { question?: string; reset?: boolean } | null;

export const AssistantPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const state = (location.state as LocState) || null;
	const [messages, setMessages] = useState<Msg[]>(DEFAULT_THREAD);

	useEffect(() => {
		if (state?.reset) {
			setMessages(DEFAULT_THREAD);
			navigate(location.pathname, { replace: true, state: null });
			return;
		}
		const q = state?.question?.trim();
		if (!q) return;
		setMessages((prev) => [...prev, { from: "user", text: q }, replyFor(q, t)]);
		navigate(location.pathname, { replace: true, state: null });
	}, [state, t, navigate, location.pathname]);

	return (
		<Page className={styles["assistant-page"]}>
			<div className={styles["assistant-page__inner"]}>
				<div>
					<h1 className={styles["assistant-page__title"]}>{t("assist.title")}</h1>
					<p className={styles["assistant-page__sub"]}>{t("assist.pageHint")}</p>
				</div>

				<div className={styles["assistant-page__thread"]}>
					{messages.map((m, i) => (
						<div
							key={`${m.from}-${i}`}
							className={cn(
								styles["assistant-page__row"],
								m.from === "user" && styles["assistant-page__row--user"],
							)}
						>
							<div
								className={cn(
									styles["assistant-page__bubble"],
									m.from === "user"
										? styles["assistant-page__bubble--user"]
										: styles["assistant-page__bubble--bot"],
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
