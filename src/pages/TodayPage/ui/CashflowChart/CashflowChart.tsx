import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ui/Card";
import { PillSwitch } from "@/shared/ui/PillSwitch";
import styles from "./CashflowChart.module.scss";

export const CashflowChart = memo(() => {
	const { t } = useTranslation();
	const [mode, setMode] = useState<"forecast" | "planfact">("forecast");
	const [view, setView] = useState<"graph" | "days">("graph");

	const W = 680;
	const H = 200;
	const pad = { left: 60, right: 20, top: 28, bottom: 26 };
	const cW = W - pad.left - pad.right;
	const cH = H - pad.top - pad.bottom;
	const minY = -80;
	const maxY = 850;
	const rangeY = maxY - minY;

	const getY = (val: number) => pad.top + cH - ((val - minY) / rangeY) * cH;
	const getX = (fraction: number) => pad.left + fraction * cW;

	const basePoints: [number, number][] = [
		[0, 412],
		[0.08, 480],
		[0.16, 780],
		[0.22, 650],
		[0.3, 680],
		[0.38, 450],
		[0.45, 480],
		[0.55, 340],
		[0.65, 420],
		[0.72, 470],
		[0.8, 560],
		[0.88, 490],
		[0.94, 530],
		[1.0, 607],
	];

	const negPoints: [number, number][] = [
		[0, 412],
		[0.08, 470],
		[0.15, 520],
		[0.22, 340],
		[0.28, 380],
		[0.35, 230],
		[0.44, 250],
		[0.52, -30.1],
		[0.6, 260],
		[0.7, 430],
		[0.8, 520],
		[0.9, 480],
		[1.0, 580],
	];

	const basePoly = basePoints.map(([fx, v]) => `${getX(fx)},${getY(v)}`).join(" ");
	const areaPoly = `${getX(0)},${getY(0)} ${basePoly} ${getX(1)},${getY(0)}`;
	const negPoly = negPoints.map(([fx, v]) => `${getX(fx)},${getY(v)}`).join(" ");
	const dipX = getX(0.52);
	const dipY = getY(-30.1);
	const zeroY = getY(0);

	return (
		<Card as="section" className={styles["cashflow-chart"]}>
			<div className={styles["cashflow-chart__top"]}>
				<h2 className={styles["cashflow-chart__title"]}>{t("today.chartTitle")}</h2>
				<PillSwitch
					value={mode}
					onChange={setMode}
					options={[
						{ value: "forecast", label: t("today.forecast") },
						{ value: "planfact", label: t("today.planFact") },
					]}
				/>
			</div>

			<div className={styles["cashflow-chart__sub"]}>
				<PillSwitch
					value={view}
					onChange={setView}
					options={[
						{ value: "graph", label: t("today.graph") },
						{ value: "days", label: t("today.byDays") },
					]}
				/>
				<a className={styles["cashflow-chart__link"]}>{t("today.aboutForecast")}</a>
			</div>

			<div className={styles["cashflow-chart__canvas"]}>
				<svg
					className={styles["cashflow-chart__svg"]}
					viewBox={`0 0 ${W} ${H}`}
					width="100%"
					height="100%"
				>
					{[0, 200, 400, 600, 800].map((tick) => {
						const y = getY(tick);
						const isZero = tick === 0;
						return (
							<g key={tick}>
								<line
									x1={pad.left}
									y1={y}
									x2={W - pad.right}
									y2={y}
									stroke={isZero ? "#374151" : "#e5e7eb"}
									strokeWidth={isZero ? 1.2 : 0.8}
								/>
								<text
									x={pad.left - 8}
									y={y + 4}
									textAnchor="end"
									fontSize="11"
									fill="#9ca3af"
								>
									{tick === 0 ? "0" : `${tick} тыс`}
								</text>
							</g>
						);
					})}

					<line
						x1={getX(0.04)}
						y1={pad.top}
						x2={getX(0.04)}
						y2={pad.top + cH}
						stroke="#9ca3af"
						strokeWidth="1.2"
						strokeDasharray="4 4"
					/>
					<text
						x={getX(0.04)}
						y={pad.top - 6}
						textAnchor="middle"
						fontSize="11"
						fontWeight="600"
						fill="#374151"
					>
						{t("today.metricToday")}
					</text>

					<polygon points={areaPoly} fill="#22c55e" fillOpacity="0.14" />
					<polyline
						points={basePoly}
						fill="none"
						stroke="#16a34a"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<polyline
						points={negPoly}
						fill="none"
						stroke="#1f2937"
						strokeWidth="2"
						strokeDasharray="5 4"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<circle cx={dipX} cy={dipY} r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
					<line
						x1={dipX}
						y1={zeroY}
						x2={dipX}
						y2={dipY}
						stroke="#ef4444"
						strokeWidth="1"
						strokeDasharray="2 2"
					/>
					<g transform={`translate(${dipX - 58}, ${dipY - 32})`}>
						<rect width="116" height="22" rx="5" fill="#dc2626" />
						<text
							x="58"
							y="15"
							textAnchor="middle"
							fontSize="11"
							fontWeight="700"
							fill="#ffffff"
						>
							5 ноя: −30 100 ₽
						</text>
					</g>

					{[
						{ label: "23.10", f: 0.04 },
						{ label: "28.10", f: 0.2 },
						{ label: "02.11", f: 0.36 },
						{ label: "07.11", f: 0.53 },
						{ label: "12.11", f: 0.69 },
						{ label: "17.11", f: 0.85 },
						{ label: "22.11", f: 1.0 },
					].map((item) => (
						<text
							key={item.label}
							x={getX(item.f)}
							y={pad.top + cH + 20}
							textAnchor="middle"
							fontSize="11"
							fill="#9ca3af"
						>
							{item.label}
						</text>
					))}
				</svg>
			</div>

			<div className={styles["cashflow-chart__metrics"]}>
				<div className={styles["cashflow-chart__metric"]}>
					<span className={styles["cashflow-chart__metric-label"]}>
						{t("today.metricToday")}
					</span>
					<span className={styles["cashflow-chart__metric-value"]}>412 300 ₽</span>
					<div className={styles["cashflow-chart__metric-line"]} />
				</div>
				<div className={styles["cashflow-chart__metric"]}>
					<span className={styles["cashflow-chart__metric-label"]}>
						{t("today.metricMin")}
					</span>
					<span className={styles["cashflow-chart__metric-value"]}>309 900 ₽</span>
					<div className={styles["cashflow-chart__metric-line"]} />
				</div>
				<div className={styles["cashflow-chart__metric"]}>
					<span className={styles["cashflow-chart__metric-label"]}>
						{t("today.metricIn30")}
					</span>
					<span className={styles["cashflow-chart__metric-value"]}>607 400 ₽</span>
					<div className={styles["cashflow-chart__metric-line"]} />
				</div>
			</div>
		</Card>
	);
});
