import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import styles from "./CalendarPage.module.scss";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const EVENTS: Record<number, string> = {
	27: "Дельта +340",
	28: "ЕНП −186",
	30: "Зерно −214",
	5: "Зарплата",
};

export const CalendarPage = memo(() => {
	const { t } = useTranslation();

	return (
		<Page className={styles["calendar-page"]}>
			<h1 className={styles["calendar-page__title"]}>{t("nav.calendar")}</h1>
			<Card className={styles["calendar-page__card"]}>
				<div className={styles["calendar-page__weekdays"]}>
					{WEEKDAYS.map((w) => (
						<span key={w}>{w}</span>
					))}
				</div>
				<div className={styles["calendar-page__grid"]}>
					{Array.from({ length: 35 }, (_, i) => {
						const day = i - 2;
						const show = day >= 1 && day <= 31;
						const ev = show ? EVENTS[day] : "";
						return (
							<div key={i} className={styles["calendar-page__day"]}>
								{show ? <span>{day}</span> : null}
								{ev ? <span className={styles["calendar-page__ev"]}>{ev}</span> : null}
							</div>
						);
					})}
				</div>
			</Card>
		</Page>
	);
});

export default CalendarPage;
