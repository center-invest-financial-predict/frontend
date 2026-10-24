import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGetCalendarQuery } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { dayOfMonth } from "@/shared/lib/format/formatDate";
import { getRouteAdd, getRouteEvents } from "@/shared/consts/router";
import styles from "./CalendarPage.module.scss";

export const CalendarPage = memo(() => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const now = useMemo(() => new Date(), []);
	const year = now.getFullYear();
	const month = now.getMonth() + 1;
	const { data, isLoading, isError, refetch } = useGetCalendarQuery({ year, month });

	const weekdays = useMemo(() => {
		const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
		const base = new Date(2024, 0, 1);
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(base);
			d.setDate(base.getDate() + i);
			return d.toLocaleDateString(locale, { weekday: "short" });
		});
	}, [i18n.language]);

	const eventsByDay = useMemo(() => {
		const map: Record<number, string> = {};
		data?.events.forEach((e) => {
			const day = dayOfMonth(e.date);
			if (day) map[day] = e.label;
		});
		return map;
	}, [data?.events]);

	const todayDay = data?.today ? dayOfMonth(data.today) || now.getDate() : now.getDate();
	const daysInMonth = new Date(year, month, 0).getDate();
	const startWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;

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

			{isLoading ? <Skeleton variant="chart" label={t("states.loading")} /> : null}
			{isError ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			) : null}

			{!isLoading && !isError ? (
				<Card className={styles["calendar-page__card"]}>
					<div className={styles["calendar-page__weekdays"]}>
						{weekdays.map((w) => (
							<span key={w}>{w}</span>
						))}
					</div>
					<div className={styles["calendar-page__grid"]}>
						{Array.from({ length: 42 }, (_, i) => {
							const day = i - startWeekday + 1;
							const show = day >= 1 && day <= daysInMonth;
							const ev = show ? eventsByDay[day] : "";
							const weekend = i % 7 >= 5;
							const today = show && day === todayDay;
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
			) : null}
		</Page>
	);
});

export default CalendarPage;
