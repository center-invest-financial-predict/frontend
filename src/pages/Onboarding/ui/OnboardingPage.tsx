import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import {
	DataSourceKind,
	useLazyLookupCompanyQuery,
	useSetMyInnsMutation,
	useUserActions,
} from "@/entities/User";
import { AuthLayout } from "@/widgets/AuthLayout";
import { parseApiError } from "@/shared/api/parseApiError";
import { getRouteLogin, getRouteMain } from "@/shared/consts/router";
import { useAppSelector } from "@/shared/lib/hooks";
import { cn } from "@/shared/lib/classNames/classNames";
import { OnboardingDraft, OnboardingStep, readDraft, STEP_ORDER, stepIndex, writeDraft } from "../model/draft";
import styles from "./OnboardingPage.module.scss";

const PROGRESS_LABELS = ["business", "money"] as const;

const SOURCE_OPTIONS: {
	id: DataSourceKind;
	titleKey: string;
	descKey: string;
}[] = [
	{
		id: "ONE_C",
		titleKey: "onboarding.srcOneC",
		descKey: "onboarding.srcOneCDesc",
	},
	{
		id: "GOS_SERVICE",
		titleKey: "onboarding.srcGos",
		descKey: "onboarding.srcGosDesc",
	},
	{
		id: "CSV",
		titleKey: "onboarding.srcFile",
		descKey: "onboarding.srcFileDesc",
	},
];

const OnboardingPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const auth = useAppSelector((state) => state.user.authData);
	const onboardingDone = useAppSelector((state) => state.user.onboardingDone);
	const { logout, setOnboardingDone, setProfile } = useUserActions();
	const [setMyInns, setInnsState] = useSetMyInnsMutation();
	const [lookupCompany, lookupState] = useLazyLookupCompanyQuery();

	const [draft, setDraft] = useState<OnboardingDraft>(() => readDraft());
	const [linkError, setLinkError] = useState<string | null>(null);

	useEffect(() => {
		writeDraft(draft);
	}, [draft]);

	useEffect(() => {
		const inn = draft.inn.replace(/\D/g, "");
		if (inn.length < 10) return;
		const timer = window.setTimeout(() => {
			void lookupCompany(inn);
		}, 400);
		return () => window.clearTimeout(timer);
	}, [draft.inn, lookupCompany]);

	if (!auth) {
		return <Navigate to={getRouteLogin()} replace />;
	}
	if (onboardingDone) {
		return <Navigate to={getRouteMain()} replace />;
	}

	const update = (patch: Partial<OnboardingDraft>) => {
		setDraft((prev) => ({ ...prev, ...patch }));
	};

	const goStep = (step: OnboardingStep) => update({ step });

	const finishOnboarding = async () => {
		if (!draft.business?.inn || setInnsState.isLoading) return;
		try {
			await setMyInns({ inns: [draft.business.inn] }).unwrap();
			setProfile({
				business: draft.business,
				sources: draft.sources,
				assumptions: draft.assumptions,
			});
			setOnboardingDone(true);
			navigate(getRouteMain());
		} catch (err) {
			setLinkError(parseApiError(err, t("onboarding.innLinkFailed")));
		}
	};

	const onBack = () => {
		const i = stepIndex(draft.step);
		if (i <= 0) {
			const snapshot: OnboardingDraft = {
				...draft,
				step: "business",
				assumptions: { ...draft.assumptions },
			};
			logout();
			writeDraft(snapshot);
			navigate({ pathname: getRouteLogin(), search: "?tab=up" });
			return;
		}
		goStep(STEP_ORDER[i - 1]);
	};

	const onNext = async () => {
		setLinkError(null);
		if (draft.step === "business") {
			if (!draft.business) return;
			goStep("sources");
			return;
		}
		if (draft.step === "sources") {
			await finishOnboarding();
		}
	};

	const canContinue =
		draft.step === "business"
			? !!draft.business
			: draft.sources.length > 0 && !!draft.business?.inn && !setInnsState.isLoading;

	const toggleSource = (id: DataSourceKind) => {
		const sources = draft.sources.includes(id)
			? draft.sources.filter((item) => item !== id)
			: [...draft.sources, id];
		update({ sources, lowData: sources.includes("CSV") });
	};

	const progressIndex = stepIndex(draft.step);

	return (
		<AuthLayout>
			<div className={styles.onboarding}>
				<div className={styles.onboarding__steps} aria-label={t("onboarding.progress")}>
					{PROGRESS_LABELS.map((key, i) => {
						const done = i < progressIndex;
						const current = i === progressIndex;
						return (
							<div
								key={key}
								className={cn(
									styles.onboarding__step,
									done && styles["onboarding__step--done"],
									current && styles["onboarding__step--current"],
								)}
								title={t(`onboarding.steps.${key}`)}
							>
								<span className={styles["onboarding__step-dot"]}>{i + 1}</span>
							</div>
						);
					})}
				</div>

				<div key={draft.step} className={styles.onboarding__panel}>
					{draft.step === "business" ? (
						<>
							<div className={styles.onboarding__head}>
								<h1 className={styles.onboarding__title}>{t("onboarding.bizTitle")}</h1>
								<p className={styles.onboarding__sub}>{t("onboarding.bizSub")}</p>
							</div>
							<label className={styles.onboarding__field}>
								<span>{t("onboarding.inn")}</span>
								<input
									className={styles.onboarding__input}
									value={draft.inn}
									onChange={(e) => update({ inn: e.target.value, business: null })}
									inputMode="numeric"
									autoComplete="off"
								/>
							</label>
							{draft.inn.replace(/\D/g, "").length >= 10 ? (
								<div className={styles.onboarding__list}>
									{lookupState.isFetching ? (
										<div className={styles.onboarding__sub}>{t("onboarding.lookupLoading")}</div>
									) : null}
									{lookupState.isError ? (
										<div className={styles.onboarding__error} role="alert">
											{parseApiError(lookupState.error, t("onboarding.lookupFailed"))}
										</div>
									) : null}
									{lookupState.data
										? (() => {
												const company = lookupState.data;
												const active = draft.business?.inn === company.inn;
												return (
													<button
														type="button"
														className={cn(
															styles.onboarding__option,
															active && styles["onboarding__option--active"],
														)}
														onClick={() =>
															update({
																inn: company.inn,
																business: {
																	inn: company.inn,
																	name: company.name || company.inn,
																	form: company.legalForm || "",
																	tax: "",
																	city: "",
																},
															})
														}
													>
														<span>
															<span className={styles["onboarding__option-title"]}>
																{company.name || company.inn}
															</span>
															<span className={styles["onboarding__option-meta"]}>
																{company.inn}
																{company.industry ? ` · ${company.industry}` : ""}
															</span>
														</span>
														{active ? (
															<Check className={styles.onboarding__check} size={20} strokeWidth={2} />
														) : null}
													</button>
												);
											})()
										: null}
								</div>
							) : null}
						</>
					) : null}

					{draft.step === "sources" ? (
						<>
							<h1 className={styles.onboarding__title}>{t("onboarding.srcTitle")}</h1>
							<div className={styles.onboarding__list}>
								{SOURCE_OPTIONS.map((option) => {
									const active = draft.sources.includes(option.id);
									return (
										<button
											key={option.id}
											type="button"
											className={cn(
												styles.onboarding__option,
												active && styles["onboarding__option--active"],
											)}
											onClick={() => toggleSource(option.id)}
										>
											<span>
												<span className={styles["onboarding__option-title"]}>{t(option.titleKey)}</span>
												<span className={styles["onboarding__option-meta"]}>{t(option.descKey)}</span>
											</span>
											{active ? (
												<Check className={styles.onboarding__check} size={20} strokeWidth={2} />
											) : null}
										</button>
									);
								})}
							</div>
						</>
					) : null}
				</div>

				{linkError ? (
					<div className={styles.onboarding__error} role="alert">
						{linkError}
					</div>
				) : null}

				<button type="button" className={styles.onboarding__primary} disabled={!canContinue} onClick={onNext}>
					{setInnsState.isLoading
						? t("onboarding.linking")
						: draft.step === "sources"
							? t("onboarding.openToday")
							: t("onboarding.continue")}
				</button>

				<div className={styles.onboarding__nav}>
					<button type="button" className={styles.onboarding__back} onClick={onBack}>
						{t("onboarding.back")}
					</button>
				</div>
			</div>
		</AuthLayout>
	);
};

export default OnboardingPage;
