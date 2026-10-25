import { Business, DataSourceKind, UserAssumptions } from "@/entities/User";
import { ONBOARDING_DRAFT } from "@/shared/consts/localStorage";

export type OnboardingStep = "business" | "sources";

export type OnboardingDraft = {
	step: OnboardingStep;
	business: Business | null;
	inn: string;
	sources: DataSourceKind[];
	assumptions: UserAssumptions;
	lowData: boolean;
};

export const DEFAULT_ASSUMPTIONS: UserAssumptions = {
	minBalance: "200 000",
	payDay: 5,
	notifyApp: true,
	notifyMail: true,
};

export const DEFAULT_DRAFT: OnboardingDraft = {
	step: "business",
	business: null,
	inn: "",
	sources: [],
	assumptions: DEFAULT_ASSUMPTIONS,
	lowData: false,
};

const isStep = (value: unknown): value is OnboardingStep =>
	value === "business" || value === "sources";

const isSource = (value: unknown): value is DataSourceKind =>
	value === "ONE_C" || value === "GOS_SERVICE";

const normalizeSources = (raw: unknown): DataSourceKind[] => {
	if (Array.isArray(raw)) {
		return raw.filter(isSource);
	}
	if (raw === "ONE_C" || raw === "GOS_SERVICE") return [raw];
	return [];
};

export const readDraft = (): OnboardingDraft => {
	const raw = localStorage.getItem(ONBOARDING_DRAFT);
	if (!raw) return { ...DEFAULT_DRAFT, assumptions: { ...DEFAULT_ASSUMPTIONS } };
	try {
		const parsed = JSON.parse(raw) as Partial<OnboardingDraft> & { source?: unknown; step?: string };
		const sources = normalizeSources(parsed.sources ?? parsed.source);
		const step: OnboardingStep = isStep(parsed.step)
			? parsed.step
			: parsed.step === "assumptions" || parsed.step === "building"
				? "sources"
				: "business";
		return {
			...DEFAULT_DRAFT,
			...parsed,
			sources,
			lowData: false,
			assumptions: { ...DEFAULT_ASSUMPTIONS, ...parsed.assumptions },
			step,
		};
	} catch {
		return { ...DEFAULT_DRAFT, assumptions: { ...DEFAULT_ASSUMPTIONS } };
	}
};

export const writeDraft = (draft: OnboardingDraft) => {
	localStorage.setItem(ONBOARDING_DRAFT, JSON.stringify(draft));
};

export const STEP_ORDER: OnboardingStep[] = ["business", "sources"];

export const stepIndex = (step: OnboardingStep) => STEP_ORDER.indexOf(step);
