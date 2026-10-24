import { FC, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";
import { cn } from "@/shared/lib/classNames/classNames";
import { getRouteAssistant } from "@/shared/consts/router";
import styles from "./CashAssistantBar.module.scss";

export const CashAssistantBar: FC = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [isListening, setIsListening] = useState(false);

	const handleSend = () => {
		const text = query.trim();
		if (!text) {
			navigate(getRouteAssistant());
			return;
		}
		setQuery("");
		navigate(getRouteAssistant(), { state: { question: text } });
	};

	return (
		<div className={styles["cash-assistant-bar"]}>
			<input
				className={styles["cash-assistant-bar__input"]}
				placeholder={t("assistantBar.placeholder")}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") handleSend();
				}}
			/>
			<button
				type="button"
				className={cn(
					styles["cash-assistant-bar__mic"],
					isListening && styles["cash-assistant-bar__mic--listening"],
				)}
				onClick={() => setIsListening(!isListening)}
				title={isListening ? t("assistantBar.micStop") : t("assistantBar.micStart")}
			>
				<Mic size={20} strokeWidth={1.3} />
			</button>
			<span className={styles["cash-assistant-bar__hint"]}>{t("assistantBar.hint")}</span>
			<button
				type="button"
				className={styles["cash-assistant-bar__send"]}
				onClick={handleSend}
			>
				{t("assistantBar.send")}
			</button>
		</div>
	);
});
