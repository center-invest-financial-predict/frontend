import { FC, memo, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CashflowSeriesDto } from "@/entities/Finance";
import { formatDayMonth, formatDayMonthShort } from "@/shared/lib/format/formatDate";
import { formatMoneyAbs } from "@/shared/lib/format/formatMoney";
import { cn } from "@/shared/lib/classNames/classNames";
import { Skeleton } from "@/shared/ui/Skeleton";
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
		const [hoverY, setHoverY] = useState<number | null>(null);
		const series = seriesProp ?? emptySeries;

		const setHit = (i: number, e: ReactMouseEvent<SVGRectElement>) => {
			setHover(i);
			const svg = e.currentTarget.ownerSVGElement;
			const ctm = svg?.getScreenCTM();
			if (!svg || !ctm) return;
			const pt = svg.createSVGPoint();
			pt.x = e.clientX;
			pt.y = e.clientY;
			setHoverY(pt.matrixTransform(ctm.inverse()).y);
		};

		const clearHit = () => {
			setHover(null);
			setHoverY(null);
		};

		const points = series.points ?? [];
		const dayCount = points.length;
		const isHistory = !showRisk && dayCount > 0 && series.todayIndex === dayCount - 1;

		const W = compact ? 340 : isHistory ? 1100 : 740;
		const H = compact ? 150 : isHistory ? 240 : 340;
		const pad = compact
			? { left: 56, right: 10, top: 10, bottom: 18 }
			: isHistory
				? { left: 72, right: 36, top: 36, bottom: 36 }
				: { left: 64, right: 16, top: 26, bottom: 26 };
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

		// Black only where risk differs from base (+ neighbors so segments meet the green line)
		const negDiffers = (i: number) => {
			const p = points[i];
			return p?.pessimisticBalance != null && p.pessimisticBalance !== p.balance;
		};
		let negPath = "";
		if (showRisk) {
			let pen = false;
			for (let i = 0; i < dayCount; i++) {
				const p = points[i];
				const keep =
					p.pessimisticBalance != null &&
					(negDiffers(i) || (i > 0 && negDiffers(i - 1)) || (i < dayCount - 1 && negDiffers(i + 1)));
				if (!keep) {
					pen = false;
					continue;
				}
				const cmd = pen ? "L" : "M";
				negPath += `${cmd}${getX(i)} ${getY(p.pessimisticBalance!)}`;
				pen = true;
			}
		}

		const todayX = getX(todayIndex);
		const todayLabelAnchor = todayIndex <= 0 ? "start" : todayIndex >= dayCount - 1 ? "end" : "middle";
		const todayLabelX =
			todayIndex <= 0 ? pad.left + 2 : todayIndex >= dayCount - 1 ? W - pad.right - 2 : todayX;

		const axisLabel = (iso: string) =>
			isHistory
				? String(new Date(`${iso}T00:00:00`).getDate()).padStart(2, "0")
				: formatDayMonth(iso, locale);

		const labelSlotPx = isHistory ? 36 : 56;
		const maxLabels = Math.max(3, Math.floor(cW / labelSlotPx));
		const xEvery = compact
			? Math.max(dayCount - 1, 1)
			: Math.max(1, Math.ceil((dayCount - 1) / Math.max(maxLabels - 1, 1)));
		const todayClear = showToday ? Math.max(1, Math.ceil(xEvery * 0.6)) : 0;

		const dateTicks: { label: string; i: number }[] = [];
		for (let i = 0; i < dayCount; i += xEvery) {
			if (showToday && Math.abs(i - todayIndex) < todayClear) continue;
			dateTicks.push({ label: axisLabel(points[i].date), i });
		}
		const lastI = dayCount - 1;
		if (dayCount > 0 && !(showToday && todayIndex === lastI)) {
			const prev = dateTicks[dateTicks.length - 1];
			if (!prev || prev.i !== lastI) {
				const minGap = Math.max(1, Math.ceil(xEvery * 0.75));
				const tick = { label: axisLabel(points[lastI].date), i: lastI };
				if (prev && lastI - prev.i < minGap) {
					dateTicks[dateTicks.length - 1] = tick;
				} else {
					dateTicks.push(tick);
				}
			}
		}

		const baseStroke = compact ? 2.5 : 3;
		const negDash = compact ? "4 3" : "6 5";
		const labelFs = compact ? 10 : 12;

		const hoverPoint = hover != null ? points[hover] : null;
		const isGapHover = showGap && hover === gapIndex && series.gap != null;
		const riskVal = hoverPoint?.pessimisticBalance;
		const baseVal = hoverPoint?.balance ?? 0;
		const hasSplit = Boolean(showRisk && !isGapHover && riskVal != null && riskVal !== baseVal);

		let tipIsRisk = false;
		if (isGapHover) {
			tipIsRisk = true;
		} else if (hasSplit && riskVal != null && hoverY != null) {
			tipIsRisk = Math.abs(hoverY - getY(riskVal)) <= Math.abs(hoverY - getY(baseVal));
		}

		const tipValue = isGapHover ? series.gap!.balance : tipIsRisk && riskVal != null ? riskVal : baseVal;
		const otherValue = hasSplit ? (tipIsRisk ? baseVal : riskVal!) : null;
		const tipW = 128;
		const tipH = otherValue != null ? 54 : 40;
		const tipX = hoverPoint
			? Math.max(pad.left, Math.min(getX(hover!) - tipW / 2, W - pad.right - tipW))
			: 0;
		const tipY = hoverPoint ? Math.max(pad.top, getY(tipValue) - tipH - 12) : 0;

		if (isLoading) {
			return (
				<div className={styles["cashflow-chart"]} aria-busy="true" aria-label={t("states.loading")}>
					<Skeleton variant="chart" />
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
						onMouseLeave={clearHit}
					>
						{yTicks.map((tick) => {
							const y = getY(tick);
							const isZero = tick === 0;
							const thousands = Math.round(tick / 1000);
							const labelY = Math.min(H - 12, Math.max(14, y + 4));
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
									<text
										x={pad.left - 10}
										y={labelY}
										textAnchor="end"
										fontSize={labelFs}
										fill="var(--color-text-muted)"
									>
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

						{showRisk && negPath ? (
							<path
								d={negPath}
								fill="none"
								stroke="var(--color-text)"
								strokeWidth={2}
								strokeDasharray={negDash}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						) : null}
						<polyline
							points={basePoly}
							fill="none"
							stroke="var(--color-primary-bright)"
							strokeWidth={baseStroke}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>

						{dateTicks.map((item) => (
							<text
								key={`${item.label}-${item.i}`}
								x={getX(item.i)}
								y={H - 12}
								textAnchor={item.i === 0 ? "start" : item.i === dayCount - 1 ? "end" : "middle"}
								fontSize={labelFs}
								fill="var(--color-text-muted)"
							>
								{item.label}
							</text>
						))}

						{showToday ? (
							<>
								<line
									x1={todayX}
									y1={pad.top}
									x2={todayX}
									y2={H - pad.bottom}
									stroke="var(--color-text-faint)"
									strokeWidth="1"
									strokeDasharray="3 3"
								/>
								<text
									x={isHistory ? Math.max(pad.left, todayX - 8) : todayLabelX}
									y={isHistory ? pad.top - 8 : H - 12}
									textAnchor={isHistory ? "end" : todayLabelAnchor}
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
									onMouseEnter={(e) => setHit(i, e)}
									onMouseMove={(e) => setHit(i, e)}
									onFocus={() => {
										setHover(i);
										setHoverY(null);
									}}
									onBlur={clearHit}
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
								{hasSplit && riskVal != null ? (
									<circle
										cx={getX(hover!)}
										cy={getY(riskVal)}
										r={tipIsRisk ? 6 : 4}
										fill="var(--color-danger)"
										stroke="var(--color-surface)"
										strokeWidth="2"
									/>
								) : null}
								{!isGapHover ? (
									<circle
										cx={getX(hover!)}
										cy={getY(baseVal)}
										r={!tipIsRisk ? 6 : hasSplit ? 4 : 5}
										fill="var(--color-surface)"
										stroke="var(--color-primary-bright)"
										strokeWidth="3"
									/>
								) : null}
								{isGapHover ? (
									<circle
										cx={getX(hover!)}
										cy={getY(tipValue)}
										r="6"
										fill="var(--color-danger)"
										stroke="var(--color-surface)"
										strokeWidth="2"
									/>
								) : null}
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
								{otherValue != null ? (
									<text
										x={tipX + tipW / 2}
										y={tipY + 46}
										textAnchor="middle"
										fontSize={10}
										fill="var(--color-text-faint)"
									>
										{formatMoneyAbs(otherValue, locale)}
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
