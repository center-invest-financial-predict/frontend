import { FC, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic } from "lucide-react";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./CashAssistantBar.module.scss";

export const CashAssistantBar: FC = memo(() => {
	const { t } = useTranslation();
	const [query, setQuery] = useState("");
	const [isListening, setIsListening] = useState(false);

	const handleSend = () => {
		if (!query.trim()) return;
		setQuery("");
	};

	return (
		<div className={styles["cash-assistant-bar"]}>
			<div className={styles["cash-assistant-bar__card"]}>
				<div className={styles["cash-assistant-bar__field"]}>
					<input
						className={styles["cash-assistant-bar__input"]}
						placeholder={t("assistantBar.placeholder")}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSend();
						}}
					/>
				</div>

				<button
					type="button"
					className={cn(
						styles["cash-assistant-bar__mic"],
						isListening && styles["cash-assistant-bar__mic--listening"],
					)}
					onClick={() => setIsListening(!isListening)}
					title={isListening ? t("assistantBar.micStop") : t("assistantBar.micStart")}
				>
					<Mic size={18} />
				</button>

				<span className={styles["cash-assistant-bar__hint"]}>
					{t("assistantBar.hint")}
				</span>

				<button
					type="button"
					className={styles["cash-assistant-bar__send"]}
					onClick={handleSend}
				>
					{t("assistantBar.send")}
				</button>
			</div>
		</div>
	);
});
