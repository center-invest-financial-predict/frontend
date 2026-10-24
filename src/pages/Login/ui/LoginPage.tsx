import { FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
	mapApiUserToAuthData,
	useRegisterMutation,
	useSignInMutation,
	useUserActions,
} from "@/entities/User";
import { AuthLayout } from "@/widgets/AuthLayout";
import { ONBOARDING_DONE, USER_PROFILE } from "@/shared/consts/localStorage";
import { getRouteMain, getRouteOnboarding } from "@/shared/consts/router";
import { useAppSelector } from "@/shared/lib/hooks";
import { cn } from "@/shared/lib/classNames/classNames";
import { parseApiError } from "@/shared/api/parseApiError";
import styles from "./LoginPage.module.scss";

type AuthTab = "in" | "up";

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const splitFio = (fio: string) => {
	const parts = fio.trim().split(/\s+/).filter(Boolean);
	return {
		lastName: parts[0] || "",
		firstName: parts[1] || "",
		middleName: parts.slice(2).join(" ") || undefined,
	};
};

const LoginPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const { setAuthData, setOnboardingDone, setProfile } = useUserActions();
	const auth = useAppSelector((state) => state.user.authData);
	const onboardingDone = useAppSelector((state) => state.user.onboardingDone);
	const existingProfile = useAppSelector((state) => state.user.profile);

	const [signIn, signInState] = useSignInMutation();
	const [register, registerState] = useRegisterMutation();

	const initialTab: AuthTab = params.get("tab") === "up" ? "up" : "in";
	const [tab, setTab] = useState<AuthTab>(initialTab);
	const [fio, setFio] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [password2, setPassword2] = useState("");
	const [touched, setTouched] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);

	const pending = signInState.isLoading || registerState.isLoading;
	const pwBad = tab === "up" && !!password2 && password !== password2;
	const fioParts = splitFio(fio);
	const fioIncomplete = tab === "up" && (!fioParts.lastName || !fioParts.firstName);

	const canSubmit = useMemo(() => {
		if (!emailOk(email) || password.length < 6) return false;
		if (tab === "up") {
			return !fioIncomplete && password === password2;
		}
		return true;
	}, [email, fioIncomplete, password, password2, tab]);

	if (auth) {
		return <Navigate to={onboardingDone ? getRouteMain() : getRouteOnboarding()} replace />;
	}

	const finishAuth = (inns: string[]) => {
		const hasInns = inns.length > 0;
		if (tab === "up" || !hasInns) {
			localStorage.removeItem(USER_PROFILE);
			setOnboardingDone(false);
			navigate(getRouteOnboarding());
			return;
		}

		const inn = inns[0];
		if (!existingProfile?.business?.inn) {
			setProfile({
				business: {
					inn,
					name: t("company.innLabel", { inn }),
					form: t("company.defaultForm"),
					tax: "",
					city: "",
				},
			});
		}
		setOnboardingDone(true);
		localStorage.setItem(ONBOARDING_DONE, "1");
		navigate(getRouteMain());
	};

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setTouched(true);
		setServerError(null);
		if (!canSubmit || pwBad || pending) return;

		const normalizedEmail = email.trim().toLowerCase();

		try {
			if (tab === "up") {
				const { lastName, firstName, middleName } = splitFio(fio);
				const data = await register({
					email: normalizedEmail,
					password,
					firstName,
					lastName,
					middleName,
				}).unwrap();
				setAuthData(mapApiUserToAuthData(data.user));
				finishAuth(data.user.inns ?? []);
				return;
			}

			const data = await signIn({ email: normalizedEmail, password }).unwrap();
			setAuthData(mapApiUserToAuthData(data.user));
			finishAuth(data.user.inns ?? []);
		} catch (err) {
			setServerError(parseApiError(err, t("auth.formInvalid")));
		}
	};

	const errorText = pwBad
		? t("auth.passwordMismatch")
		: serverError
			? serverError
			: touched && !canSubmit
				? fioIncomplete
					? t("auth.fioRequired")
					: password.length > 0 && password.length < 6
						? t("auth.passwordTooShort")
						: t("auth.formInvalid")
				: null;

	return (
		<AuthLayout>
			<form className={styles["login-page"]} onSubmit={onSubmit}>
				<div className={styles["login-page__seg"]} role="tablist" aria-label={t("auth.loginTitle")}>
					<button
						type="button"
						role="tab"
						id="auth-tab-in"
						aria-selected={tab === "in"}
						aria-controls="auth-panel"
						tabIndex={tab === "in" ? 0 : -1}
						className={cn(styles["login-page__seg-btn"], tab === "in" && styles["login-page__seg-btn--active"])}
						onClick={() => {
							setTab("in");
							setServerError(null);
						}}
						disabled={pending}
					>
						{t("auth.tabIn")}
					</button>
					<button
						type="button"
						role="tab"
						id="auth-tab-up"
						aria-selected={tab === "up"}
						aria-controls="auth-panel"
						tabIndex={tab === "up" ? 0 : -1}
						className={cn(styles["login-page__seg-btn"], tab === "up" && styles["login-page__seg-btn--active"])}
						onClick={() => {
							setTab("up");
							setServerError(null);
						}}
						disabled={pending}
					>
						{t("auth.tabUp")}
					</button>
				</div>

				<div
					id="auth-panel"
					role="tabpanel"
					className={styles["login-page__panel"]}
					aria-labelledby={tab === "in" ? "auth-tab-in" : "auth-tab-up"}
				>
					{tab === "up" ? (
						<label className={styles["login-page__field"]}>
							<span className={styles["login-page__label"]}>{t("auth.fio")}</span>
							<input
								className={styles["login-page__input"]}
								value={fio}
								onChange={(e) => {
									setFio(e.target.value);
									setServerError(null);
								}}
								autoComplete="name"
								disabled={pending}
							/>
						</label>
					) : null}

					<label className={styles["login-page__field"]}>
						<span className={styles["login-page__label"]}>{t("auth.email")}</span>
						<input
							className={styles["login-page__input"]}
							type="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setServerError(null);
							}}
							autoComplete="email"
							disabled={pending}
						/>
					</label>
					<label className={styles["login-page__field"]}>
						<span className={styles["login-page__label"]}>{t("auth.password")}</span>
						<input
							className={styles["login-page__input"]}
							type="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setServerError(null);
							}}
							autoComplete={tab === "up" ? "new-password" : "current-password"}
							disabled={pending}
						/>
					</label>
					{tab === "up" ? (
						<label className={styles["login-page__field"]}>
							<span className={styles["login-page__label"]}>{t("auth.passwordRepeat")}</span>
							<input
								className={styles["login-page__input"]}
								type="password"
								value={password2}
								onChange={(e) => {
									setPassword2(e.target.value);
									setServerError(null);
								}}
								autoComplete="new-password"
								disabled={pending}
							/>
						</label>
					) : null}
				</div>

				{errorText ? (
					<div className={styles["login-page__error"]} role="alert">
						{errorText}
					</div>
				) : null}

				<button
					type="submit"
					className={styles["login-page__submit"]}
					disabled={pending || (touched && !canSubmit)}
				>
					{pending ? t("auth.submitting") : tab === "up" ? t("auth.createAccount") : t("auth.submit")}
				</button>

				{tab === "up" ? <div className={styles["login-page__terms"]}>{t("auth.terms")}</div> : null}
			</form>
		</AuthLayout>
	);
};

export default LoginPage;
