import { memo } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import { PageTitle } from "@/shared/ui/PageTitle";
import { Page } from "@/widgets/Page";
import styles from "./PlanFactPage.module.scss";

export const PlanFactPage = memo(() => {
	return (
		<Page>
			<div className={styles["plan-fact-page__header"]}>
				<PageTitle subtitle="Чем факт с 1 по 23 октября отличается от плана">
					План-факт
				</PageTitle>
			</div>

			<div className={styles["plan-fact-page__grid"]}>
				<div className={styles["plan-fact-page__card"]}>
					<div className={styles["plan-fact-page__card-header"]}>
						<div>
							<h2 className={styles["plan-fact-page__card-title"]}>Остаток: план и факт</h2>
							<span className={styles["plan-fact-page__hint"]}>Октябрь, по дням</span>
						</div>
						<div className={styles["plan-fact-page__legend"]}>
							<span
								className={cn(
									styles["plan-fact-page__legend-item"],
									styles["plan-fact-page__legend-item--fact"],
								)}
							>
								Факт
							</span>
							<span
								className={cn(
									styles["plan-fact-page__legend-item"],
									styles["plan-fact-page__legend-item--plan"],
								)}
							>
								План
							</span>
						</div>
					</div>

					<div className={styles["plan-fact-page__chart"]}>
						<svg width="100%" height="260" viewBox="0 0 600 260" preserveAspectRatio="none">
							<line x1="65" y1="40" x2="560" y2="40" stroke="#f3f4f6" strokeWidth="1" />
							<line x1="65" y1="100" x2="560" y2="100" stroke="#f3f4f6" strokeWidth="1" />
							<line x1="65" y1="160" x2="560" y2="160" stroke="#f3f4f6" strokeWidth="1" />
							<line x1="65" y1="210" x2="560" y2="210" stroke="#111827" strokeWidth="1" />
							<text x="56" y="44" textAnchor="end" fontSize="11" fill="#9ca3af">600 тыс</text>
							<text x="56" y="104" textAnchor="end" fontSize="11" fill="#9ca3af">400 тыс</text>
							<text x="56" y="164" textAnchor="end" fontSize="11" fill="#9ca3af">200 тыс</text>
							<text x="56" y="214" textAnchor="end" fontSize="11" fill="#9ca3af">0</text>
							<line x1="560" y1="30" x2="560" y2="210" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3" />
							<text x="560" y="24" textAnchor="end" fontSize="11" fontWeight="600" fill="#374151">Сегодня</text>
							<polyline
								points="65,150 115,170 165,190 225,185 285,175 345,180 405,195 465,180 515,95 560,70"
								fill="none"
								stroke="#9ca3af"
								strokeWidth="2"
								strokeDasharray="4 3"
								strokeLinecap="round"
							/>
							<polyline
								points="65,150 95,185 135,165 175,205 215,195 265,190 305,205 355,195 405,205 465,190 515,120 560,105"
								fill="none"
								stroke="#22c55e"
								strokeWidth="2.5"
								strokeLinecap="round"
							/>
							{["01.10", "05.10", "09.10", "13.10", "17.10", "21.10"].map((d, i) => (
								<text key={d} x={65 + i * 95} y="235" textAnchor="middle" fontSize="11" fill="#9ca3af">
									{d}
								</text>
							))}
						</svg>
					</div>

					<div className={styles["plan-fact-page__stats"]}>
						<div className={styles["plan-fact-page__stat"]}>
							<span className={styles["plan-fact-page__stat-label"]}>Факт на 23.10</span>
							<span className={styles["plan-fact-page__stat-value"]}>412 300 ₽</span>
						</div>
						<div className={styles["plan-fact-page__stat"]}>
							<span className={styles["plan-fact-page__stat-label"]}>План на 23.10</span>
							<span className={styles["plan-fact-page__stat-value"]}>540 700 ₽</span>
						</div>
						<div className={styles["plan-fact-page__stat"]}>
							<span className={styles["plan-fact-page__stat-label"]}>Отклонение</span>
							<span
								className={cn(
									styles["plan-fact-page__stat-value"],
									styles["plan-fact-page__stat-value--danger"],
								)}
							>
								−128 400 ₽
							</span>
						</div>
					</div>
				</div>

				<div className={styles["plan-fact-page__side"]}>
					<div className={styles["plan-fact-page__card"]}>
						<h2 className={cn(styles["plan-fact-page__card-title"], styles["plan-fact-page__card-title--sm"])}>
							Не пришло в срок
						</h2>
						<span className={styles["plan-fact-page__hint"]}>В базовый прогноз не входит</span>

						<div className={styles["plan-fact-page__overdue"]}>
							<div>
								<div className={styles["plan-fact-page__overdue-name"]}>Мельница</div>
								<div className={styles["plan-fact-page__overdue-meta"]}>
									Ждали 21.10, просрочка 2 дня
								</div>
							</div>
							<div className={styles["plan-fact-page__overdue-amount"]}>128 400 ₽</div>
						</div>
					</div>

					<div className={styles["plan-fact-page__card"]}>
						<h2 className={cn(styles["plan-fact-page__card-title"], styles["plan-fact-page__card-title--sm"])}>
							Журнал пересчётов
						</h2>
						<span className={styles["plan-fact-page__hint"]}>Последние четыре</span>

						<div className={styles["plan-fact-page__log-list"]}>
							<div className={styles["plan-fact-page__log-item"]}>
								<span className={styles["plan-fact-page__log-date"]}>23.10 08:40</span>
								<span className={styles["plan-fact-page__log-text"]}>
									Загружена выписка, минимум 309 900 ₽ на 5 ноя
								</span>
							</div>
							<div className={styles["plan-fact-page__log-item"]}>
								<span className={styles["plan-fact-page__log-date"]}>22.10 18:05</span>
								<span className={styles["plan-fact-page__log-text"]}>
									Мельница не пришла 21.10, 128 400 ₽ исключены из прогноза
								</span>
							</div>
							<div className={styles["plan-fact-page__log-item"]}>
								<span className={styles["plan-fact-page__log-date"]}>21.10 08:30</span>
								<span className={styles["plan-fact-page__log-text"]}>Плановый пересчёт после выписки</span>
							</div>
							<div className={styles["plan-fact-page__log-item"]}>
								<span className={styles["plan-fact-page__log-date"]}>20.10 08:30</span>
								<span className={styles["plan-fact-page__log-text"]}>
									Поступление Сити-Фуд 146 000 ₽ как факт
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Page>
	);
});

export default PlanFactPage;
