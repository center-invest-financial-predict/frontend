import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUserActions } from "@/entities/User";
import { getRouteLogin } from "@/shared/consts/router";
import { ScreenHeader } from "@/shared/ui/ScreenHeader";
import { Page } from "@/widgets/Page";
import styles from "./SettingsPage.module.scss";

const SECTIONS = [
	{
		titleKey: "settings.business",
		rows: [
			{ labelKey: "settings.name", valueKey: "settings.nameValue" },
			{ labelKey: "settings.inn", valueKey: "settings.innValue" },
		],
	},
	{
		titleKey: "settings.accounts",
		rows: [{ labelKey: "settings.accountCi", valueKey: "settings.connected" }],
	},
	{
		titleKey: "settings.users",
		rows: [{ labelKey: "settings.owner", valueKey: "settings.you" }],
	},
	{
		titleKey: "settings.security",
		rows: [{ labelKey: "settings.smsLogin", valueKey: "settings.enabled" }],
	},
] as const;

export const SettingsPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { logout } = useUserActions();

	const onLogout = () => {
		logout();
		navigate(getRouteLogin());
	};

	return (
		<Page>
			<ScreenHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

			<div className={styles["settings-page__card"]}>
				<h2 className={styles["settings-page__heading"]}>{t("settings.account")}</h2>
				<div className={styles["settings-page__row"]}>
					<span className={styles["settings-page__label"]}>{t("settings.linkedBiz")}</span>
					<span>3</span>
				</div>
				<button type="button" className={styles["settings-page__logout"]} onClick={onLogout}>
					{t("settings.logout")}
				</button>
			</div>

			{SECTIONS.map((section) => (
				<div key={section.titleKey} className={styles["settings-page__card"]}>
					<h2 className={styles["settings-page__heading"]}>{t(section.titleKey)}</h2>
					{section.rows.map((row) => (
						<div key={row.labelKey} className={styles["settings-page__row"]}>
							<span className={styles["settings-page__label"]}>{t(row.labelKey)}</span>
							<span>{t(row.valueKey)}</span>
						</div>
					))}
				</div>
			))}
		</Page>
	);
});

export default SettingsPage;
