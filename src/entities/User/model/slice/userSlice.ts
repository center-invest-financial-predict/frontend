import { PayloadAction } from "@reduxjs/toolkit";
import { User, UserProfile, UserSchema } from "../types/User";
import { buildSlice } from "@/shared/lib/store/buildSlice";
import { clearAuthTokens, getAccessToken, getRefreshToken } from "@/shared/api/authTokens";
import {
	ONBOARDING_DONE,
	ONBOARDING_DRAFT,
	USER_EMAIL,
	USER_NAME,
	USER_PHONE,
	USER_PROFILE,
} from "@/shared/consts/localStorage";

const readProfile = (): UserProfile | undefined => {
	const raw = localStorage.getItem(USER_PROFILE);
	if (!raw) return undefined;
	try {
		return JSON.parse(raw) as UserProfile;
	} catch {
		return undefined;
	}
};

const initialState: UserSchema = {
	authData: undefined,
	onboardingDone: false,
	profile: undefined,
	_inited: false,
};

const userSlice = buildSlice({
	name: "user",
	initialState,
	reducers: {
		setAuthData: (state, action: PayloadAction<User>) => {
			state.authData = action.payload;
			if (action.payload.username) {
				localStorage.setItem(USER_EMAIL, action.payload.username);
			}
			if (action.payload.name) {
				localStorage.setItem(USER_NAME, action.payload.name);
			}
		},
		setOnboardingDone: (state, action: PayloadAction<boolean>) => {
			state.onboardingDone = action.payload;
			if (action.payload) {
				localStorage.setItem(ONBOARDING_DONE, "1");
				localStorage.removeItem(ONBOARDING_DRAFT);
			} else {
				localStorage.removeItem(ONBOARDING_DONE);
			}
		},
		setProfile: (state, action: PayloadAction<UserProfile>) => {
			state.profile = action.payload;
			localStorage.setItem(USER_PROFILE, JSON.stringify(action.payload));
		},
		initAuthData: (state) => {
			if (getAccessToken() || getRefreshToken()) {
				const email = localStorage.getItem(USER_EMAIL) || localStorage.getItem(USER_PHONE) || "";
				state.authData = {
					id: "pending",
					username: email || "user",
					name: localStorage.getItem(USER_NAME) || undefined,
				};
				state.onboardingDone = localStorage.getItem(ONBOARDING_DONE) === "1";
				state.profile = readProfile();
			}
			state._inited = true;
		},
		logout: (state) => {
			clearAuthTokens();
			localStorage.removeItem(USER_EMAIL);
			localStorage.removeItem(USER_NAME);
			localStorage.removeItem(USER_PHONE);
			localStorage.removeItem(ONBOARDING_DONE);
			localStorage.removeItem(ONBOARDING_DRAFT);
			localStorage.removeItem(USER_PROFILE);
			state.authData = undefined;
			state.onboardingDone = false;
			state.profile = undefined;
		},
	},
});

export const { reducer: UserReducer, actions: UserActions, useActions: useUserActions } = userSlice;
