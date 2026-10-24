const HEIGHTS = [35, 40, 45, 48, 50, 55, 60, 65, 70, 80, 90, 95] as const;
const WIDTHS = [40, 55, 70, 80, 90, 100] as const;

const nearest = (levels: readonly number[], ratio: number): number => {
	const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
	return levels.reduce((best, level) => (Math.abs(level - pct) < Math.abs(best - pct) ? level : best));
};

/** Maps 0..1 → existing BEM height modifier key (`h70`). */
export const toHeightLevel = (ratio: number): `h${number}` => `h${nearest(HEIGHTS, ratio)}`;

/** Maps 0..1 → existing BEM width modifier key (`w70`). */
export const toWidthLevel = (ratio: number): `w${number}` => `w${nearest(WIDTHS, ratio)}`;
