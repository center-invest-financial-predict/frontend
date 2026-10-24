import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useListCompaniesQuery, useSignOutMutation, useUserActions } from "@/entities/User";
import { getRouteLogin } from "@/shared/consts/router";
import { useAppSelector } from "@/shared/lib/hooks";
import { ScreenHeader } from "@/shared/ui/ScreenHeader";
import { Page } from "@/widgets/Page";
import styles from "./SettingsPage.module.scss";

export const SettingsPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const auth = useAppSelector((state) => state.user.authData);
	const profile = useAppSelector((state) => state.user.profile);
	const { data: companies = [] } = useListCompaniesQuery();
	const { logout } = useUserActions();
	const [signOut] = useSignOutMutation();

	const activeInn = profile?.business?.inn || companies[0]?.inn || "—";

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
		<Page>
			<ScreenHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

			<div id="settings-account" className={styles["settings-page__card"]}>
				<h2 className={styles["settings-page__heading"]}>{t("settings.account")}</h2>
				<div className={styles["settings-page__row"]}>
					<span className={styles["settings-page__label"]}>{t("settings.linkedBiz")}</span>
					<span>{companies.length}</span>
				</div>
				{auth?.username ? (
					<div className={styles["settings-page__row"]}>
						<span className={styles["settings-page__label"]}>{t("auth.email")}</span>
						<span>{auth.username}</span>
					</div>
				) : null}
				<button type="button" className={styles["settings-page__logout"]} onClick={onLogout}>
					{t("settings.logout")}
				</button>
			</div>

			<div id="settings-business" className={styles["settings-page__card"]}>
				<h2 className={styles["settings-page__heading"]}>{t("settings.business")}</h2>
				<div className={styles["settings-page__row"]}>
					<span className={styles["settings-page__label"]}>{t("settings.inn")}</span>
					<span>{activeInn}</span>
				</div>
			</div>
		</Page>
	);
});

export default SettingsPage;
