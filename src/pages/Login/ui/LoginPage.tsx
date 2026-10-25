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

const MIN_PASSWORD = 8;

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const namePartOk = (value: string) =>
	/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё'-]*$/.test(value.trim());

const passwordOk = (value: string) => value.length >= MIN_PASSWORD && /\d/.test(value);

const splitFio = (fio: string) => {
	const parts = fio.trim().split(/\s+/).filter(Boolean);
	return {
		lastName: parts[0] || "",
		firstName: parts[1] || "",
		middleName: parts[2] || "",
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
	const fioParts = splitFio(fio);
	const fioIncomplete = !fioParts.lastName || !fioParts.firstName || !fioParts.middleName;
	const fioFormatBad =
		!fioIncomplete &&
		(!namePartOk(fioParts.lastName) ||
			!namePartOk(fioParts.firstName) ||
			!namePartOk(fioParts.middleName));

	const canSubmit = useMemo(() => {
		if (!emailOk(email)) return false;
		if (tab === "up") {
			return (
				!fioIncomplete &&
				!fioFormatBad &&
				passwordOk(password) &&
				password2.length > 0 &&
				password === password2
			);
		}
		return password.length >= MIN_PASSWORD;
	}, [email, fioFormatBad, fioIncomplete, password, password2, tab]);

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
		if (!canSubmit || pending) return;

		const normalizedEmail = email.trim().toLowerCase();

		try {
			if (tab === "up") {
				const { lastName, firstName, middleName } = splitFio(fio);
				const data = await register({
					email: normalizedEmail,
					password,
					firstName,
					lastName,
					middleName: middleName || undefined,
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

	const fioError =
		touched && tab === "up"
			? !fio.trim() || fioIncomplete
				? t("auth.fioRequired")
				: fioFormatBad
					? t("auth.fioInvalid")
					: null
			: null;
	const emailError = touched
		? !email.trim()
			? t("auth.emailRequired")
			: !emailOk(email)
				? t("auth.emailInvalid")
				: null
		: null;
	const passwordError = touched
		? !password
			? t("auth.passwordRequired")
			: tab === "up" && !passwordOk(password)
				? password.length < MIN_PASSWORD
					? t("auth.passwordTooShort")
					: t("auth.passwordWeak")
				: tab === "in" && password.length < MIN_PASSWORD
					? t("auth.passwordTooShort")
					: null
		: null;
	const password2Error =
		touched && tab === "up"
			? !password2
				? t("auth.passwordRepeatRequired")
				: password !== password2
					? t("auth.passwordMismatch")
					: null
			: null;

	const errorText = serverError;

	return (
		<AuthLayout>
			<form className={styles["login-page"]} onSubmit={onSubmit} noValidate>
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
							setTouched(false);
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
							setTouched(false);
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
								aria-invalid={!!fioError}
							/>
							{fioError ? (
								<span className={styles["login-page__error"]} role="alert">
									{fioError}
								</span>
							) : null}
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
							aria-invalid={!!emailError}
						/>
						{emailError ? (
							<span className={styles["login-page__error"]} role="alert">
								{emailError}
							</span>
						) : null}
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
							minLength={MIN_PASSWORD}
							autoComplete={tab === "up" ? "new-password" : "current-password"}
							disabled={pending}
							aria-invalid={!!passwordError}
						/>
						{passwordError ? (
							<span className={styles["login-page__error"]} role="alert">
								{passwordError}
							</span>
						) : null}
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
								aria-invalid={!!password2Error}
							/>
							{password2Error ? (
								<span className={styles["login-page__error"]} role="alert">
									{password2Error}
								</span>
							) : null}
						</label>
					) : null}
				</div>

				{errorText ? (
					<div className={styles["login-page__error"]} role="alert">
						{errorText}
					</div>
				) : null}

				<button type="submit" className={styles["login-page__submit"]} disabled={pending}>
					{pending ? t("auth.submitting") : tab === "up" ? t("auth.createAccount") : t("auth.submit")}
				</button>

			</form>
		</AuthLayout>
	);
};

export default LoginPage;
