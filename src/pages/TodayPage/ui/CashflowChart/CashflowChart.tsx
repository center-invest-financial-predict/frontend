import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./CashflowChart.module.scss";

/** Остаток на конец дня, октябрь (histChart). */
const HISTORY_K = [
	355, 201, 239, 277, 55, 81, 107, 110, 136, 77, 115, 76, 102, 128, 154, 60, 98, 136, 162, 334, 360, 386, 412,
];

/** Базовый прогноз 30 дней, тыс. ₽ (sim() из макета). */
const FORECAST_BASE_K = [
	412, 450, 488, 514, 880, 720, 746, 558, 596, 634, 480, 506, 532, 310, 336, 374, 412, 438, 367, 393, 419, 445, 483,
	521, 427, 453, 479, 505, 531, 569, 607,
];

/** Негативный сценарий (delay:14), тыс. ₽. */
const FORECAST_NEG_K = [
	412, 450, 488, 514, 540, 380, 406, 218, 256, 294, 140, 166, 192, -30, -4, 34, 72, 98, 367, 393, 419, 445, 483, 521,
	427, 453, 479, 505, 531, 569, 607,
];

const FORECAST_DATES = ["23.10", "28.10", "02.11", "07.11", "12.11", "17.11", "22.11"];

const GAP_DAY = 13;
const GAP_VAL = -30.1;
const BAND_K = 18;

type Props = {
	compact?: boolean;
	showRisk?: boolean;
	range?: 14 | 30;
	variant?: "forecast" | "history";
};

export const CashflowChart: FC<Props> = memo(
	({ compact = false, showRisk = true, range = 30, variant = "forecast" }) => {
		const { t } = useTranslation();
		const isHistory = variant === "history" && !compact;

		const W = compact ? 340 : isHistory ? 1100 : 740;
		const H = compact ? 150 : isHistory ? 200 : 340;
		const pad = compact ? { left: 56, right: 10, top: 10, bottom: 18 } : { left: 64, right: 16, top: 26, bottom: 26 };
		const cW = W - pad.left - pad.right;
		const cH = H - pad.top - pad.bottom;

		const minY = isHistory ? 0 : -100;
		const maxY = isHistory ? 600 : 800;
		const rangeY = maxY - minY;

		const dayCount = isHistory ? HISTORY_K.length : range === 14 ? 15 : FORECAST_BASE_K.length;
		const series = isHistory ? HISTORY_K : FORECAST_BASE_K.slice(0, dayCount);
		const negSeries = FORECAST_NEG_K.slice(0, dayCount);

		const showBand = showRisk && !compact && !isHistory;
		const showToday = !compact;
		const showGap = showRisk && !compact && !isHistory && dayCount > GAP_DAY;
		const todayIndex = isHistory ? HISTORY_K.length - 1 : 0;
		const xEvery = isHistory ? 2 : compact ? 30 : 5;

		const getY = (val: number) => pad.top + cH - ((val - minY) / rangeY) * cH;
		const getX = (i: number) => pad.left + (i / Math.max(dayCount - 1, 1)) * cW;

		let bandPoly = "";
		if (showBand) {
			const hi = series.map((v, i) => `${getX(i)},${getY(v + BAND_K * Math.sqrt(i))}`);
			const lo = [...series]
				.map((v, i) => [i, v] as const)
				.reverse()
				.map(([i, v]) => `${getX(i)},${getY(v - BAND_K * Math.sqrt(i))}`);
			bandPoly = [...hi, ...lo].join(" ");
		}

		const basePoly = series.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
		const negPoly = negSeries.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");

		const todayX = getX(todayIndex);
		const todayLabelX = Math.min(Math.max(todayX, 28), W - 28);
		const dipX = getX(GAP_DAY);
		const dipY = getY(GAP_VAL);
		const gapBw = 170;
		const gapBh = 26;
		const gapBx = Math.max(pad.left, Math.min(dipX - gapBw / 2, W - pad.right - gapBw));
		const gapBy = Math.max(pad.top, dipY - 64);

		const yTicks = compact ? [0, 400, 800] : isHistory ? [0, 200, 400, 600] : [0, 200, 400, 600, 800];

		const dateTicks: { label: string; i: number }[] = [];
		for (let i = 0; i < dayCount; i += xEvery) {
			if (isHistory) {
				dateTicks.push({
					label: String(i + 1).padStart(2, "0"),
					i,
				});
			} else if (compact) {
				dateTicks.push({
					label: i === 0 ? "23.10" : "22.11",
					i,
				});
			} else {
				const labelIndex = Math.round(i / 5);
				dateTicks.push({
					label: FORECAST_DATES[labelIndex] ?? FORECAST_DATES.at(-1)!,
					i,
				});
			}
		}
		if (isHistory && dateTicks[dateTicks.length - 1]?.i !== dayCount - 1) {
			dateTicks.push({
				label: String(dayCount).padStart(2, "0"),
				i: dayCount - 1,
			});
		}

		const baseStroke = compact ? 2.5 : 3;
		const negDash = compact ? "4 3" : "6 5";
		const labelFs = compact ? 10 : 12;

		return (
			<div className={cn(styles["cashflow-chart"], compact && styles["cashflow-chart--compact"])}>
				<div className={styles["cashflow-chart__canvas"]}>
					<svg
						className={styles["cashflow-chart__svg"]}
						viewBox={`0 0 ${W} ${H}`}
						preserveAspectRatio="xMidYMid meet"
						role="img"
						aria-label={isHistory ? t("operations.balTitle") : t("today.balance30")}
					>
						{yTicks.map((tick) => {
							const y = getY(tick);
							const isZero = tick === 0;
							return (
								<g key={tick}>
									<line
										x1={pad.left}
										y1={y}
										x2={W - pad.right}
										y2={y}
										stroke={isZero ? "var(--color-text)" : "var(--color-border)"}
										strokeWidth={isZero ? 1.5 : 1}
									/>
									<text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize={labelFs} fill="var(--color-text-faint)">
										{tick === 0
											? "0"
											: t("today.chartThousands", {
													value: tick,
												})}
									</text>
								</g>
							);
						})}

						{showBand && bandPoly ? <polygon points={bandPoly} fill="var(--color-primary-soft)" opacity="0.9" /> : null}

						<polyline
							points={basePoly}
							fill="none"
							stroke="var(--color-primary-bright)"
							strokeWidth={baseStroke}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						{showRisk && !isHistory ? (
							<polyline
								points={negPoly}
								fill="none"
								stroke="var(--color-text)"
								strokeWidth={2}
								strokeDasharray={negDash}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						) : null}

						{dateTicks.map((item) => (
							<text
								key={`${item.label}-${item.i}`}
								x={getX(item.i)}
								y={H - 6}
								textAnchor={item.i === dayCount - 1 ? "end" : "middle"}
								fontSize={labelFs}
								fill="var(--color-text-faint)"
							>
								{item.label}
							</text>
						))}

						{showToday ? (
							<>
								<line
									x1={todayX}
									y1={pad.top - 6}
									x2={todayX}
									y2={H - pad.bottom}
									stroke="var(--color-text-faint)"
									strokeWidth="1"
									strokeDasharray="3 3"
								/>
								<text
									x={todayLabelX}
									y={12}
									textAnchor="middle"
									fontSize={labelFs}
									fontWeight="600"
									fill="var(--color-text)"
								>
									{t("today.metricToday")}
								</text>
							</>
						) : null}

						{showGap ? (
							<>
								<line
									x1={dipX}
									y1={gapBy + gapBh}
									x2={dipX}
									y2={dipY - 6}
									stroke="var(--color-danger)"
									strokeWidth="1"
								/>
								<circle
									cx={dipX}
									cy={dipY}
									r="6"
									fill="var(--color-danger)"
									stroke="var(--color-surface)"
									strokeWidth="2"
								/>
								<rect x={gapBx} y={gapBy} width={gapBw} height={gapBh} rx="8" fill="var(--color-danger)" />
								<text
									x={gapBx + gapBw / 2}
									y={gapBy + 18}
									textAnchor="middle"
									fontSize={labelFs}
									fontWeight="600"
									fill="var(--color-surface)"
								>
									{t("today.chartGap")}
								</text>
							</>
						) : null}
					</svg>
				</div>
			</div>
		);
	},
);
