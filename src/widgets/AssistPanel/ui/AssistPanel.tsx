import { FC, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUIActions } from "@/features/UI";
import { getRouteForecast } from "@/shared/consts/router";
import styles from "./AssistPanel.module.scss";

type QaKey = "a" | "b";

const ANSWERS: Record<QaKey, { qKey: string; aKey: string; linkKey: string }> = {
	a: {
		qKey: "assist.q1",
		aKey: "assist.a1",
		linkKey: "assist.link1",
	},
	b: {
		qKey: "assist.q2",
		aKey: "assist.a2",
		linkKey: "assist.link2",
	},
};

export const AssistPanel: FC = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { setAssistOpen } = useUIActions();
	const [qa, setQa] = useState<QaKey[]>(["a"]);

	const ask = (key: QaKey) => {
		setQa((prev) => [...prev.filter((k) => k !== key), key]);
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

			<div className={styles["assist-panel__thread"]}>
				{qa.map((key) => {
					const item = ANSWERS[key];
					return (
						<div key={key} className={styles["assist-panel__turn"]}>
							<div className={styles["assist-panel__q"]}>{t(item.qKey)}</div>
							<div className={styles["assist-panel__a"]}>
								{t(item.aKey)}
								<button
									type="button"
									className={styles["assist-panel__link"]}
									onClick={() => {
										setAssistOpen(false);
										navigate(getRouteForecast());
									}}
								>
									{t(item.linkKey)}
								</button>
							</div>
						</div>
					);
				})}
			</div>

			<div className={styles["assist-panel__quick"]}>
				{(Object.keys(ANSWERS) as QaKey[]).map((key) => (
					<button
						key={key}
						type="button"
						className={styles["assist-panel__chip"]}
						onClick={() => ask(key)}
					>
						{t(ANSWERS[key].qKey)}
					</button>
				))}
			</div>
		</aside>
	);
});
