import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./CashflowChart.module.scss";

type Props = {
	compact?: boolean;
	showRisk?: boolean;
	range?: 14 | 30;
};

export const CashflowChart: FC<Props> = memo(
	({ compact = false, showRisk = true, range = 30 }) => {
		const { t } = useTranslation();

		const W = compact ? 340 : 740;
		const H = compact ? 150 : 340;
		const pad = compact
			? { left: 56, right: 12, top: 12, bottom: 20 }
			: { left: 64, right: 16, top: 26, bottom: 26 };
		const cW = W - pad.left - pad.right;
		const cH = H - pad.top - pad.bottom;
		const minY = -100;
		const maxY = 800;
		const rangeY = maxY - minY;
		const cut = range === 14 ? 0.47 : 1;
		const bandK = 18;
		const showBand = showRisk && !compact;
		const showToday = !compact;
		const showGap = showRisk && !compact && cut >= 0.52;

		const getY = (val: number) => pad.top + cH - ((val - minY) / rangeY) * cH;
		const getX = (fraction: number) => pad.left + (fraction / cut) * cW;

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
		].filter(([fx]) => fx <= cut) as [number, number][];

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
		].filter(([fx]) => fx <= cut) as [number, number][];

		let bandPoly = "";
		if (showBand) {
			const spreadAt = (fx: number, v: number, sign: 1 | -1) => {
				const day = fx * 30;
				return `${getX(fx)},${getY(v + sign * bandK * Math.sqrt(day))}`;
			};
			const hi = basePoints.map(([fx, v]) => spreadAt(fx, v, 1));
			const lo = [...basePoints]
				.reverse()
				.map(([fx, v]) => spreadAt(fx, v, -1));
			bandPoly = [...hi, ...lo].join(" ");
		}

		const basePoly = basePoints.map(([fx, v]) => `${getX(fx)},${getY(v)}`).join(" ");
		const negPoly = negPoints.map(([fx, v]) => `${getX(fx)},${getY(v)}`).join(" ");
		const todayX = getX(0);
		const todayLabelX = Math.min(Math.max(todayX, 28), W - 28);
		const dipX = getX(0.52);
		const dipY = getY(-30.1);
		const gapBw = 170;
		const gapBh = 26;
		const gapBx = Math.max(pad.left, Math.min(dipX - gapBw / 2, W - pad.right - gapBw));
		const gapBy = Math.max(pad.top, dipY - 64);

		const yTicks = compact ? [0, 400, 800] : [0, 200, 400, 600, 800];

		const dates = compact
			? [
					{ label: "23.10", f: 0 },
					{ label: "22.11", f: 1.0 },
				]
			: range === 14
				? [
						{ label: "23.10", f: 0 },
						{ label: "28.10", f: 0.2 },
						{ label: "02.11", f: 0.36 },
						{ label: "06.11", f: 0.47 },
					]
				: [
						{ label: "23.10", f: 0 },
						{ label: "28.10", f: 0.2 },
						{ label: "02.11", f: 0.36 },
						{ label: "07.11", f: 0.53 },
						{ label: "12.11", f: 0.69 },
						{ label: "17.11", f: 0.85 },
						{ label: "22.11", f: 1.0 },
					];

		const baseStroke = compact ? 2.5 : 3;
		const negDash = compact ? "4 3" : "6 5";

		return (
			<div
				className={cn(
					styles["cashflow-chart"],
					compact && styles["cashflow-chart--compact"],
				)}
			>
				<div className={styles["cashflow-chart__canvas"]}>
					<svg
						className={styles["cashflow-chart__svg"]}
						viewBox={`0 0 ${W} ${H}`}
						preserveAspectRatio="xMidYMid meet"
						role="img"
						aria-label={t("today.balance30")}
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
									<text
										x={pad.left - 8}
										y={y + 4}
										textAnchor="end"
										fontSize="12"
										fill="var(--color-text-faint)"
									>
										{tick === 0
											? "0"
											: t("today.chartThousands", { value: tick })}
									</text>
								</g>
							);
						})}

						{showBand && bandPoly ? (
							<polygon
								points={bandPoly}
								fill="var(--color-primary-soft)"
								opacity="0.95"
							/>
						) : null}

						<polyline
							points={basePoly}
							fill="none"
							stroke="var(--color-primary)"
							strokeWidth={baseStroke}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						{showRisk ? (
							<polyline
								points={negPoly}
								fill="none"
								stroke="var(--color-text)"
								strokeWidth="2"
								strokeDasharray={negDash}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						) : null}

						{dates.map((item) => (
							<text
								key={item.label}
								x={getX(item.f)}
								y={H - 6}
								textAnchor={item.f >= 1 ? "end" : "middle"}
								fontSize="12"
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
									strokeWidth="1.2"
									strokeDasharray="3 3"
								/>
								<text
									x={todayLabelX}
									y={12}
									textAnchor="middle"
									fontSize="12"
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
								<rect
									x={gapBx}
									y={gapBy}
									width={gapBw}
									height={gapBh}
									rx="8"
									fill="var(--color-danger)"
								/>
								<text
									x={gapBx + gapBw / 2}
									y={gapBy + 18}
									textAnchor="middle"
									fontSize="12"
									fontWeight="600"
									fill="var(--color-surface)"
								>
									{t("today.chartGap")}
								</text>
								<circle
									cx={dipX}
									cy={dipY}
									r="6"
									fill="var(--color-danger)"
									stroke="var(--color-surface)"
									strokeWidth="2"
								/>
							</>
						) : null}
					</svg>
				</div>
			</div>
		);
	},
);
