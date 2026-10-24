import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import { getRouteAdd, getRouteEvents } from "@/shared/consts/router";
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
	const navigate = useNavigate();

	return (
		<Page className={styles["calendar-page"]}>
			<div className={styles["calendar-page__head"]}>
				<div>
					<h1 className={styles["calendar-page__title"]}>{t("events.title")}</h1>
					<p className={styles["calendar-page__sub"]}>{t("events.subtitle")}</p>
				</div>
				<div className={styles["calendar-page__actions"]}>
					<div className={styles["calendar-page__seg"]}>
						<button type="button" className={styles["calendar-page__pill"]} onClick={() => navigate(getRouteEvents())}>
							{t("events.list")}
						</button>
						<button type="button" className={styles["calendar-page__pill--on"]}>
							{t("events.cal")}
						</button>
					</div>
					<button type="button" className={styles["calendar-page__add"]} onClick={() => navigate(getRouteAdd())}>
						{t("events.add")}
					</button>
				</div>
			</div>
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
						const weekend = i % 7 >= 5;
						const today = day === 23;
						return (
							<div
								key={i}
								className={cn(
									styles["calendar-page__day"],
									weekend && styles["calendar-page__day--weekend"],
									today && styles["calendar-page__day--today"],
								)}
							>
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
