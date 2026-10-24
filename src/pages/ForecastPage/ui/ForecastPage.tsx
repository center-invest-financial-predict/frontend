import { memo, useState } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import { PageTitle } from "@/shared/ui/PageTitle";
import { Page } from "@/widgets/Page";
import styles from "./ForecastPage.module.scss";

export const ForecastPage = memo(() => {
	const [revenueDown, setRevenueDown] = useState(true);
	const [revenuePct, setRevenuePct] = useState("-20%");
	const [unplannedExp, setUnplannedExp] = useState(false);
	const [unplannedVal, setUnplannedVal] = useState("150 тыс");
	const [fixedCostUp, setFixedCostUp] = useState(false);
	const [fixedCostPct, setFixedCostPct] = useState("+10%");

	return (
		<Page>
			<PageTitle className={styles["forecast-page__title"]}>Прогноз и сценарии</PageTitle>

			<div className={styles["forecast-page__top-grid"]}>
				<div className={styles["forecast-page__card"]}>
					<h2 className={styles["forecast-page__section-title"]}>Параметры стресс-теста</h2>

					<div className={styles["forecast-page__control"]}>
						<label className={styles["forecast-page__checkbox-label"]}>
							<input
								type="checkbox"
								checked={revenueDown}
								onChange={(e) => setRevenueDown(e.target.checked)}
							/>
							Выручка ниже
						</label>
						<div className={styles["forecast-page__pills"]}>
							{["-10%", "-20%", "-30%"].map((p) => (
								<button
									key={p}
									type="button"
									className={cn(
										styles["forecast-page__pill"],
										revenueDown &&
											revenuePct === p &&
											styles["forecast-page__pill--active"],
									)}
									onClick={() => {
										setRevenueDown(true);
										setRevenuePct(p);
									}}
								>
									{p}
								</button>
							))}
						</div>
					</div>

					<div className={styles["forecast-page__control"]}>
						<label className={styles["forecast-page__checkbox-label"]}>
							<input
								type="checkbox"
								checked={unplannedExp}
								onChange={(e) => setUnplannedExp(e.target.checked)}
							/>
							Внеплановый расход
						</label>
						<div className={styles["forecast-page__pills"]}>
							{["100 тыс", "150 тыс", "250 тыс"].map((p) => (
								<button
									key={p}
									type="button"
									className={cn(
										styles["forecast-page__pill"],
										unplannedExp &&
											unplannedVal === p &&
											styles["forecast-page__pill--active"],
									)}
									onClick={() => {
										setUnplannedExp(true);
										setUnplannedVal(p);
									}}
								>
									{p}
								</button>
							))}
						</div>
					</div>

					<div className={styles["forecast-page__control"]}>
						<label className={styles["forecast-page__checkbox-label"]}>
							<input
								type="checkbox"
								checked={fixedCostUp}
								onChange={(e) => setFixedCostUp(e.target.checked)}
							/>
							Рост постоянных расходов
						</label>
						<div className={styles["forecast-page__pills"]}>
							{["+5%", "+10%", "+20%"].map((p) => (
								<button
									key={p}
									type="button"
									className={cn(
										styles["forecast-page__pill"],
										fixedCostUp &&
											fixedCostPct === p &&
											styles["forecast-page__pill--active"],
									)}
									onClick={() => {
										setFixedCostUp(true);
										setFixedCostPct(p);
									}}
								>
									{p}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className={styles["forecast-page__card"]}>
					<h2 className={styles["forecast-page__section-title"]}>Моделирование кассового разрыва</h2>
					<div className={styles["forecast-page__chart"]}>
						<svg width="100%" height="230" viewBox="0 0 560 230" preserveAspectRatio="none">
							<line x1="65" y1="30" x2="540" y2="30" stroke="#f3f4f6" strokeWidth="1" />
							<line x1="65" y1="80" x2="540" y2="80" stroke="#f3f4f6" strokeWidth="1" />
							<line x1="65" y1="130" x2="540" y2="130" stroke="#f3f4f6" strokeWidth="1" />
							<line x1="65" y1="180" x2="540" y2="180" stroke="#111827" strokeWidth="1.2" />
							<text x="56" y="34" textAnchor="end" fontSize="11" fill="#9ca3af">400 тыс</text>
							<text x="56" y="84" textAnchor="end" fontSize="11" fill="#9ca3af">200 тыс</text>
							<text x="56" y="134" textAnchor="end" fontSize="11" fill="#9ca3af">0</text>
							<text x="56" y="184" textAnchor="end" fontSize="11" fill="#9ca3af">-200 тыс</text>
							<polyline
								points="65,90 115,75 165,82 215,65 265,78 305,105 355,90 405,82 455,75 505,72 540,68"
								fill="none"
								stroke="#22c55e"
								strokeWidth="2.5"
								strokeLinecap="round"
							/>
							<polyline
								points="65,90 115,78 165,95 215,110 265,118 305,185 355,140 405,115 455,95 505,85 540,78"
								fill="none"
								stroke="#1f2937"
								strokeWidth="2"
								strokeDasharray="5 4"
								strokeLinecap="round"
							/>
							<circle cx="305" cy="185" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
							<rect x="250" y="145" width="110" height="24" rx="5" fill="#dc2626" />
							<text x="305" y="161" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">
								5 ноя: −30 100 ₽
							</text>
							{["23.10", "28.10", "02.11", "07.11", "12.11", "17.11", "22.11"].map((d, i) => (
								<text key={d} x={65 + i * 78} y="215" textAnchor="middle" fontSize="11" fill="#9ca3af">
									{d}
								</text>
							))}
						</svg>
					</div>

					<div className={styles["forecast-page__alert"]}>
						Итог: разрыв 5 ноября, не хватает 30 100 ₽
					</div>
				</div>
			</div>

			<div className={styles["forecast-page__card"]}>
				<h2 className={styles["forecast-page__section-title"]}>Сохранённые сценарии</h2>
				<span className={styles["forecast-page__meta"]}>
					Пересчитаны на данные от 23.10 08:40
				</span>

				<table className={styles["forecast-page__table"]}>
					<thead>
						<tr>
							<th className={styles["forecast-page__th"]}>Сценарий</th>
							<th className={styles["forecast-page__th"]}>Минимум баланса</th>
							<th className={styles["forecast-page__th"]}>Дата</th>
							<th className={styles["forecast-page__th"]}>Разрыв</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td className={cn(styles["forecast-page__td"], styles["forecast-page__td--strong"])}>
								Дельта-Сервис позже на 14 дней
							</td>
							<td className={styles["forecast-page__td"]}>−30 100 ₽</td>
							<td className={styles["forecast-page__td"]}>5 ноя</td>
							<td className={cn(styles["forecast-page__td"], styles["forecast-page__td--danger"])}>
								−30 100 ₽
							</td>
						</tr>
						<tr>
							<td className={cn(styles["forecast-page__td"], styles["forecast-page__td--strong"])}>
								Задержка 14 дней и спад выручки 20%
							</td>
							<td className={styles["forecast-page__td"]}>−107 200 ₽</td>
							<td className={styles["forecast-page__td"]}>5 ноя</td>
							<td className={cn(styles["forecast-page__td"], styles["forecast-page__td--danger"])}>
								−107 200 ₽
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</Page>
	);
});

export default ForecastPage;
