import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Bell, HelpCircle, Moon, Sun, User } from "lucide-react";
import { useUIActions } from "@/features/UI";
import { useAppSelector } from "@/shared/lib/hooks";
import { IconButton } from "@/shared/ui/IconButton";
import styles from "./Header.module.scss";

export const Header: FC = memo(() => {
	const { t } = useTranslation();
	const theme = useAppSelector((state) => state.ui.theme);
	const { toggleTheme } = useUIActions();

	return (
		<header className={styles.header}>
			<div className={styles.header__search}>
				<Search size={16} color="currentColor" />
				<input
					className={styles.header__input}
					placeholder={t("header.searchPlaceholder")}
				/>
				<span className={styles.header__shortcut}>⌘K</span>
			</div>

			<div className={styles.header__actions}>
				<IconButton title={t("header.notifications")}>
					<Bell size={18} strokeWidth={1.9} />
				</IconButton>
				<IconButton title={t("header.help")}>
					<HelpCircle size={18} strokeWidth={1.9} />
				</IconButton>
				<IconButton title={t("header.theme")} onClick={() => toggleTheme()}>
					{theme === "dark" ? (
						<Sun size={18} strokeWidth={1.9} />
					) : (
						<Moon size={18} strokeWidth={1.9} />
					)}
				</IconButton>
				<IconButton title={t("header.profile")}>
					<User size={18} strokeWidth={1.9} />
				</IconButton>
			</div>
		</header>
	);
});
