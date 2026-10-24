import { FC, memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Bell, HelpCircle, Moon, Sun, User } from "lucide-react";
import { useUIActions } from "@/features/UI";
import { useSignOutMutation, useUserActions } from "@/entities/User";
import { useAppSelector } from "@/shared/lib/hooks";
import { IconButton } from "@/shared/ui/IconButton";
import { LanguageSwitcher } from "@/shared/ui/LanguageSwitcher";
import { getRouteLogin } from "@/shared/consts/router";
import { HeaderSearch } from "./HeaderSearch";
import styles from "./Header.module.scss";

export const Header: FC = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const theme = useAppSelector((state) => state.ui.theme);
	const auth = useAppSelector((state) => state.user.authData);
	const { toggleTheme } = useUIActions();
	const { logout } = useUserActions();
	const [signOut] = useSignOutMutation();
	const [userOpen, setUserOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!userOpen) return;
		const onDoc = (e: MouseEvent) => {
			if (!menuRef.current?.contains(e.target as Node)) setUserOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [userOpen]);

	const onLogout = async () => {
		try {
			await signOut().unwrap();
		} catch {
			/* clear local session even if network fails */
		}
		logout();
		navigate(getRouteLogin());
	};

	return (
		<header className={styles.header}>
			<HeaderSearch />

			<div className={styles.header__actions}>
				<LanguageSwitcher />
				<IconButton title={t("header.notifications")}>
					<Bell size={18} strokeWidth={1.3} />
				</IconButton>
				<IconButton title={t("header.help")}>
					<HelpCircle size={18} strokeWidth={1.3} />
				</IconButton>
				<IconButton title={t("header.theme")} onClick={() => toggleTheme()}>
					{theme === "dark" ? <Sun size={18} strokeWidth={1.3} /> : <Moon size={18} strokeWidth={1.3} />}
				</IconButton>

				<div className={styles["header__user-wrap"]} ref={menuRef}>
					<IconButton title={t("header.profile")} onClick={() => setUserOpen((v) => !v)}>
						<User size={18} strokeWidth={1.3} />
					</IconButton>
					{userOpen ? (
						<div className={styles["header__user-menu"]}>
							<div className={styles["header__user-info"]}>
								<div className={styles["header__user-name"]}>
									{auth?.name || auth?.username || t("header.profile")}
								</div>
							</div>
							<div className={styles["header__user-divider"]} />
							<button type="button" className={styles["header__user-logout"]} onClick={onLogout}>
								{t("nav.logout")}
							</button>
						</div>
					) : null}
				</div>
			</div>
		</header>
	);
});
