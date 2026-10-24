import { Business, DataSourceKind, UserAssumptions } from "@/entities/User";
import { ONBOARDING_DRAFT } from "@/shared/consts/localStorage";

export type OnboardingStep = "business" | "sources" | "assumptions" | "building";

export type OnboardingDraft = {
	step: OnboardingStep;
	business: Business | null;
	inn: string;
	source: DataSourceKind | null;
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
	source: "bank",
	assumptions: DEFAULT_ASSUMPTIONS,
	lowData: false,
};

export const readDraft = (): OnboardingDraft => {
	const raw = localStorage.getItem(ONBOARDING_DRAFT);
	if (!raw) return { ...DEFAULT_DRAFT, assumptions: { ...DEFAULT_ASSUMPTIONS } };
	try {
		return { ...DEFAULT_DRAFT, ...(JSON.parse(raw) as OnboardingDraft) };
	} catch {
		return { ...DEFAULT_DRAFT, assumptions: { ...DEFAULT_ASSUMPTIONS } };
	}
};

export const writeDraft = (draft: OnboardingDraft) => {
	localStorage.setItem(ONBOARDING_DRAFT, JSON.stringify(draft));
};

export const STEP_ORDER: OnboardingStep[] = [
	"business",
	"sources",
	"assumptions",
	"building",
];

export const stepIndex = (step: OnboardingStep) => STEP_ORDER.indexOf(step);
