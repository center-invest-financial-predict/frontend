import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUIActions } from "@/features/UI";
import { getRouteAssistant } from "@/shared/consts/router";
import styles from "./AssistPanel.module.scss";

const QUICK_KEYS = ["assist.q1", "assist.q2"] as const;

export const AssistPanel: FC = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { setAssistOpen } = useUIActions();

	const ask = (question: string) => {
		setAssistOpen(false);
		navigate(getRouteAssistant(), { state: { question } });
	};

	return (
		<aside className={styles["assist-panel"]}>
			<div className={styles["assist-panel__head"]}>
				<span className={styles["assist-panel__title"]}>{t("assist.title")}</span>
				<button
					type="button"
					className={styles["assist-panel__close"]}
					onClick={() => setAssistOpen(false)}
				>
					{t("assist.close")}
				</button>
			</div>
			<div className={styles["assist-panel__meta"]}>{t("assist.meta")}</div>

			<div className={styles["assist-panel__quick"]}>
				{QUICK_KEYS.map((key) => (
					<button
						key={key}
						type="button"
						className={styles["assist-panel__chip"]}
						onClick={() => ask(t(key))}
					>
						{t(key)}
					</button>
				))}
			</div>
		</aside>
	);
});
