import { PayloadAction } from "@reduxjs/toolkit";
import { User, UserProfile, UserSchema } from "../types/User";
import { buildSlice } from "@/shared/lib/store/buildSlice";
import {
	ONBOARDING_DONE,
	ONBOARDING_DRAFT,
	USER_ACCESS_TOKEN,
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
			const token = localStorage.getItem(USER_ACCESS_TOKEN);
			if (token) {
				const email =
					localStorage.getItem(USER_EMAIL) ||
					localStorage.getItem(USER_PHONE) ||
					"demo";
				state.authData = {
					id: "stub",
					username: email,
					name: localStorage.getItem(USER_NAME) || undefined,
				};
				state.onboardingDone = localStorage.getItem(ONBOARDING_DONE) === "1";
				state.profile = readProfile();
			}
			state._inited = true;
		},
		logout: (state) => {
			localStorage.removeItem(USER_ACCESS_TOKEN);
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
