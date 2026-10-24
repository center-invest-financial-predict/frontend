import { FC, memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CashflowSeriesDto } from "@/entities/Finance";
import { formatDayMonth, formatDayMonthShort } from "@/shared/lib/format/formatDate";
import { formatMoneyAbs } from "@/shared/lib/format/formatMoney";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./CashflowChart.module.scss";

type Props = {
	series?: CashflowSeriesDto | null;
	compact?: boolean;
	showRisk?: boolean;
	isLoading?: boolean;
	isError?: boolean;
	onRetry?: () => void;
};

const emptySeries: CashflowSeriesDto = { points: [] };

const niceTicks = (min: number, max: number, count = 5): number[] => {
	if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
		return [0, 200_000, 400_000, 600_000, 800_000];
	}
	const pad = (max - min) * 0.08;
	const lo = min - pad;
	const hi = max + pad;
	const step = Math.max(50_000, Math.ceil((hi - lo) / (count - 1) / 50_000) * 50_000);
	const start = Math.floor(lo / step) * step;
	const ticks: number[] = [];
	for (let v = start; v <= hi + step / 2; v += step) {
		ticks.push(v);
	}
	if (!ticks.includes(0) && lo < 0 && hi > 0) {
		ticks.push(0);
		ticks.sort((a, b) => a - b);
	}
	return ticks;
};

export const CashflowChart: FC<Props> = memo(
	({ series: seriesProp, compact = false, showRisk = true, isLoading = false, isError = false, onRetry }) => {
		const { t, i18n } = useTranslation();
		const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
		const [hover, setHover] = useState<number | null>(null);
		const series = seriesProp ?? emptySeries;

		const points = series.points ?? [];
		const dayCount = points.length;
		const isHistory = !showRisk && dayCount > 0 && series.todayIndex === dayCount - 1;

		const W = compact ? 340 : isHistory ? 1100 : 740;
		const H = compact ? 150 : isHistory ? 200 : 340;
		const pad = compact ? { left: 56, right: 10, top: 10, bottom: 18 } : { left: 64, right: 16, top: 26, bottom: 26 };
		const cW = W - pad.left - pad.right;
		const cH = H - pad.top - pad.bottom;

		const values = useMemo(() => {
			const list: number[] = [];
			points.forEach((p) => {
				list.push(p.balance);
				if (showRisk && p.pessimisticBalance != null) list.push(p.pessimisticBalance);
				if (showRisk && p.upperBound != null) list.push(p.upperBound);
				if (showRisk && p.lowerBound != null) list.push(p.lowerBound);
			});
			if (series.gap) list.push(series.gap.balance);
			return list;
		}, [points, series.gap, showRisk]);

		const minY = values.length ? Math.min(...values, 0) : 0;
		const maxY = values.length ? Math.max(...values, 0) : 800_000;
		const rangeY = maxY - minY || 1;
		const yTicks = niceTicks(minY, maxY, compact ? 3 : 5);

		const getY = (val: number) => pad.top + cH - ((val - minY) / rangeY) * cH;
		const getX = (i: number) => pad.left + (i / Math.max(dayCount - 1, 1)) * cW;
		const colW = dayCount > 1 ? cW / (dayCount - 1) : cW;

		const todayIndex = series.todayIndex ?? (isHistory ? Math.max(dayCount - 1, 0) : 0);
		const showToday = !compact && dayCount > 0;
		const showBand = showRisk && !compact && points.some((p) => p.upperBound != null && p.lowerBound != null);
		const gapIndex = series.gap ? points.findIndex((p) => p.date === series.gap!.date) : -1;
		const showGap = showRisk && !compact && gapIndex >= 0 && series.gap != null;

		const xEvery = isHistory ? 2 : compact ? Math.max(dayCount - 1, 1) : Math.max(1, Math.floor((dayCount - 1) / 6));

		let bandPoly = "";
		if (showBand) {
			const hi = points.map((p, i) => `${getX(i)},${getY(p.upperBound ?? p.balance)}`);
			const lo = [...points]
				.map((p, i) => [i, p] as const)
				.reverse()
				.map(([i, p]) => `${getX(i)},${getY(p.lowerBound ?? p.balance)}`);
			bandPoly = [...hi, ...lo].join(" ");
		}

		const basePoly = points.map((p, i) => `${getX(i)},${getY(p.balance)}`).join(" ");
		const negPoly = points
			.map((p, i) => (p.pessimisticBalance == null ? null : `${getX(i)},${getY(p.pessimisticBalance)}`))
			.filter(Boolean)
			.join(" ");

		const todayX = getX(todayIndex);
		const todayLabelX = Math.min(Math.max(todayX, 28), W - 28);

		const dateTicks: { label: string; i: number }[] = [];
		for (let i = 0; i < dayCount; i += xEvery) {
			dateTicks.push({
				label: isHistory
					? String(new Date(`${points[i].date}T00:00:00`).getDate()).padStart(2, "0")
					: formatDayMonth(points[i].date, locale),
				i,
			});
		}
		if (dayCount > 0 && dateTicks[dateTicks.length - 1]?.i !== dayCount - 1) {
			const last = points[dayCount - 1];
			dateTicks.push({
				label: isHistory
					? String(new Date(`${last.date}T00:00:00`).getDate()).padStart(2, "0")
					: formatDayMonth(last.date, locale),
				i: dayCount - 1,
			});
		}

		const baseStroke = compact ? 2.5 : 3;
		const negDash = compact ? "4 3" : "6 5";
		const labelFs = compact ? 10 : 12;

		const hoverPoint = hover != null ? points[hover] : null;
		const isGapHover = showGap && hover === gapIndex && series.gap != null;
		const tipValue = isGapHover
			? series.gap!.balance
			: showRisk && hoverPoint?.pessimisticBalance != null && hoverPoint.pessimisticBalance < hoverPoint.balance
				? hoverPoint.pessimisticBalance
				: (hoverPoint?.balance ?? 0);
		const tipIsRisk =
			isGapHover ||
			(showRisk &&
				hoverPoint?.pessimisticBalance != null &&
				hoverPoint.pessimisticBalance < hoverPoint.balance &&
				tipValue === hoverPoint.pessimisticBalance);

		const showBaseInTip =
			Boolean(showRisk && hoverPoint && tipIsRisk && !isGapHover && tipValue !== hoverPoint.balance);
		const tipW = 128;
		const tipH = showBaseInTip ? 54 : 40;
		const tipX = hoverPoint
			? Math.max(pad.left, Math.min(getX(hover!) - tipW / 2, W - pad.right - tipW))
			: 0;
		const tipY = hoverPoint ? Math.max(pad.top, getY(tipValue) - tipH - 12) : 0;

		if (isLoading) {
			return (
				<div className={cn(styles["cashflow-chart"], styles["cashflow-chart--state"])}>
					{t("states.loading")}
				</div>
			);
		}

		if (isError) {
			return (
				<div className={cn(styles["cashflow-chart"], styles["cashflow-chart--state"])}>
					<span>{t("states.errorTitle")}</span>
					{onRetry ? (
						<button type="button" className={styles["cashflow-chart__retry"]} onClick={onRetry}>
							{t("states.errorRetry")}
						</button>
					) : null}
				</div>
			);
		}

		if (dayCount === 0) {
			return (
				<div className={cn(styles["cashflow-chart"], styles["cashflow-chart--state"])}>
					{t("states.emptyTitle")}
				</div>
			);
		}

		return (
			<div className={cn(styles["cashflow-chart"], compact && styles["cashflow-chart--compact"])}>
				<div className={styles["cashflow-chart__canvas"]}>
					<svg
						className={styles["cashflow-chart__svg"]}
						viewBox={`0 0 ${W} ${H}`}
						preserveAspectRatio="xMidYMid meet"
						role="img"
						aria-label={t("today.balance30")}
						onMouseLeave={() => setHover(null)}
					>
						{yTicks.map((tick) => {
							const y = getY(tick);
							const isZero = tick === 0;
							const thousands = Math.round(tick / 1000);
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
													value: thousands,
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
						{showRisk && negPoly ? (
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

						{showGap && series.gap ? (
							<circle
								cx={getX(gapIndex)}
								cy={getY(series.gap.balance)}
								r="6"
								fill="var(--color-danger)"
								stroke="var(--color-surface)"
								strokeWidth="2"
							/>
						) : null}

						{/* Full-height columns — hover works on green line, dashed line and gap dot */}
						{points.map((p, i) => {
							const x = getX(i);
							const half = Math.max(colW / 2, 8);
							return (
								<rect
									key={p.date}
									x={x - half}
									y={pad.top}
									width={half * 2}
									height={cH}
									fill="transparent"
									className={styles["cashflow-chart__hit"]}
									onMouseEnter={() => setHover(i)}
									onFocus={() => setHover(i)}
									onBlur={() => setHover(null)}
									tabIndex={0}
									role="img"
									aria-label={`${formatDayMonthShort(p.date, locale)} ${formatMoneyAbs(
										i === gapIndex && series.gap ? series.gap.balance : p.balance,
										locale,
									)}`}
								/>
							);
						})}

						{hoverPoint ? (
							<g className={styles["cashflow-chart__tip"]} pointerEvents="none">
								<line
									x1={getX(hover!)}
									y1={pad.top}
									x2={getX(hover!)}
									y2={H - pad.bottom}
									stroke="var(--color-text-faint)"
									strokeWidth="1"
									strokeDasharray="2 3"
								/>
								<circle
									cx={getX(hover!)}
									cy={getY(tipValue)}
									r="5"
									fill={tipIsRisk ? "var(--color-danger)" : "var(--color-primary-bright)"}
									stroke="var(--color-surface)"
									strokeWidth="2"
								/>
								<rect
									x={tipX}
									y={tipY}
									width={tipW}
									height={tipH}
									rx="8"
									fill="var(--color-surface)"
									stroke="var(--color-border)"
								/>
								<text
									x={tipX + tipW / 2}
									y={tipY + 16}
									textAnchor="middle"
									fontSize={11}
									fill="var(--color-text-faint)"
								>
									{formatDayMonthShort(hoverPoint.date, locale)}
								</text>
								<text
									x={tipX + tipW / 2}
									y={tipY + 32}
									textAnchor="middle"
									fontSize={13}
									fontWeight="600"
									fill={tipIsRisk ? "var(--color-danger)" : "var(--color-text)"}
								>
									{formatMoneyAbs(tipValue, locale)}
								</text>
								{showBaseInTip ? (
									<text
										x={tipX + tipW / 2}
										y={tipY + 46}
										textAnchor="middle"
										fontSize={10}
										fill="var(--color-text-faint)"
									>
										{formatMoneyAbs(hoverPoint.balance, locale)}
									</text>
								) : null}
							</g>
						) : null}
					</svg>
				</div>
			</div>
		);
	},
);
