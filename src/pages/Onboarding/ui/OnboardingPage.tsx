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

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const innChecksumOk = (inn: string) => {
	const n = digitsOnly(inn).split("").map(Number);
	const check = (coeffs: number[]) => {
		const sum = coeffs.reduce((acc, c, i) => acc + c * n[i], 0);
		return (sum % 11) % 10;
	};
	if (n.length === 10) return check([2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[9];
	if (n.length === 12) {
		return (
			check([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[10] &&
			check([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[11]
		);
	}
	return false;
};

const isInnValid = (inn: string) => innChecksumOk(inn);

const isStubCompany = (company: { inn: string; name?: string | null }) => {
	const inn = digitsOnly(company.inn);
	const name = (company.name || "").trim();
	if (!name || name === inn) return true;
	return new RegExp(`^(компания|company)\\s*${inn}$`, "i").test(name);
};

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
	const [innTouched, setInnTouched] = useState(false);

	useEffect(() => {
		writeDraft(draft);
	}, [draft]);

	useEffect(() => {
		const inn = digitsOnly(draft.inn);
		if (!isInnValid(inn)) return;
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

	const innLinkMessage = (err: unknown) => {
		const raw = parseApiError(err, "");
		if (/unknown inn/i.test(raw)) return t("onboarding.innNotFound");
		return parseApiError(err, t("onboarding.innNotFound"));
	};

	const finishOnboarding = () => {
		if (!draft.business?.inn || setInnsState.isLoading) return;
		setProfile({
			business: draft.business,
			sources: draft.sources,
			assumptions: draft.assumptions,
		});
		setOnboardingDone(true);
		navigate(getRouteMain());
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
			if (!draft.business?.inn || setInnsState.isLoading) return;
			try {
				await setMyInns({ inns: [draft.business.inn] }).unwrap();
				goStep("sources");
			} catch (err) {
				update({ business: null });
				setLinkError(innLinkMessage(err));
			}
			return;
		}
		if (draft.step === "sources") {
			if (draft.sources.length === 0) return;
			finishOnboarding();
		}
	};

	const innDigits = digitsOnly(draft.inn);
	const innLengthOk = innDigits.length === 10 || innDigits.length === 12;
	const lookupHit =
		lookupState.isSuccess && lookupState.data && digitsOnly(lookupState.data.inn) === innDigits
			? lookupState.data
			: null;
	const matchedCompany = lookupHit && !isStubCompany(lookupHit) ? lookupHit : null;
	const stubCompany = lookupHit && isStubCompany(lookupHit) ? lookupHit : null;
	const manualCompany =
		!lookupHit &&
		isInnValid(draft.inn) &&
		!lookupState.isFetching &&
		(lookupState.isError || lookupState.isSuccess)
			? { inn: innDigits, name: innDigits, legalForm: "", industry: "" }
			: null;
	const selectableCompany = matchedCompany || stubCompany || manualCompany;
	const isUnknownCompany = Boolean(stubCompany || manualCompany);
	const showInnFormatError =
		innDigits.length > 0 && !innLengthOk && (innTouched || innDigits.length === 11);
	const showInnChecksumError = innLengthOk && !isInnValid(draft.inn);
	const showInnUnknownHint =
		isInnValid(draft.inn) && !lookupState.isFetching && isUnknownCompany;

	const canContinue =
		draft.step === "business"
			? isInnValid(draft.inn) && !!draft.business?.inn && !setInnsState.isLoading
			: draft.sources.length > 0 && !!draft.business?.inn && !setInnsState.isLoading;

	const toggleSource = (id: DataSourceKind) => {
		const sources = draft.sources.includes(id)
			? draft.sources.filter((item) => item !== id)
			: [...draft.sources, id];
		update({ sources, lowData: false });
	};

	const progressIndex = stepIndex(draft.step);

	const stepReachable = (i: number) => {
		if (i <= 0) return true;
		if (i === 1) return !!draft.business;
		return false;
	};

	const goToStep = (i: number) => {
		if (!stepReachable(i) || i === progressIndex || setInnsState.isLoading) return;
		setLinkError(null);
		goStep(STEP_ORDER[i]);
	};

	return (
		<AuthLayout>
			<div className={styles.onboarding}>
				<div className={styles.onboarding__steps} aria-label={t("onboarding.progress")}>
					{PROGRESS_LABELS.map((key, i) => {
						const done = i < progressIndex;
						const current = i === progressIndex;
						const locked = !stepReachable(i);
						return (
							<button
								key={key}
								type="button"
								className={cn(
									styles.onboarding__step,
									done && styles["onboarding__step--done"],
									current && styles["onboarding__step--current"],
									locked && styles["onboarding__step--locked"],
								)}
								title={t(`onboarding.steps.${key}`)}
								aria-current={current ? "step" : undefined}
								aria-disabled={locked}
								disabled={locked || setInnsState.isLoading}
								onClick={() => goToStep(i)}
							>
								<span className={styles["onboarding__step-dot"]}>{i + 1}</span>
							</button>
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
									onChange={(e) => {
										const inn = digitsOnly(e.target.value).slice(0, 12);
										setLinkError(null);
										update({ inn, business: null });
									}}
									onBlur={() => setInnTouched(true)}
									inputMode="numeric"
									maxLength={12}
									autoComplete="off"
								/>
							</label>
							{showInnFormatError ? (
								<div className={styles.onboarding__error} role="alert">
									{t("onboarding.innInvalid")}
								</div>
							) : null}
							{showInnChecksumError ? (
								<div className={styles.onboarding__error} role="alert">
									{t("onboarding.innChecksum")}
								</div>
							) : null}
							{showInnUnknownHint ? (
								<div className={styles.onboarding__sub} role="status">
									{t("onboarding.innUnknownHint")}
								</div>
							) : null}
							{isInnValid(draft.inn) ? (
								<div className={styles.onboarding__list}>
									{lookupState.isFetching ? (
										<div className={styles.onboarding__sub}>{t("onboarding.lookupLoading")}</div>
									) : null}
									{selectableCompany && !linkError
										? (() => {
												const company = selectableCompany;
												const inn = digitsOnly(company.inn);
												const active = digitsOnly(draft.business?.inn ?? "") === inn;
												const title = isUnknownCompany
													? t("onboarding.useEnteredInn")
													: company.name || company.inn;
												return (
													<button
														type="button"
														className={cn(
															styles.onboarding__option,
															active && styles["onboarding__option--active"],
														)}
														disabled={setInnsState.isLoading}
														onClick={() => {
															void (async () => {
																setLinkError(null);
																try {
																	await setMyInns({ inns: [inn] }).unwrap();
																	update({
																		inn,
																		business: {
																			inn,
																			name: isUnknownCompany
																				? inn
																				: company.name || inn,
																			form: company.legalForm || "",
																			tax: "",
																			city: "",
																		},
																	});
																} catch (err) {
																	update({ business: null });
																	setLinkError(innLinkMessage(err));
																}
															})();
														}}
													>
														<span>
															<span className={styles["onboarding__option-title"]}>{title}</span>
															<span className={styles["onboarding__option-meta"]}>
																{inn}
																{!isUnknownCompany && company.industry
																	? ` · ${company.industry}`
																	: ""}
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
