import { FC, useEffect } from "react";
import { mapApiUserToAuthData, useGetMeQuery, useUserActions } from "@/entities/User";
import { getAccessToken, getRefreshToken } from "@/shared/api/authTokens";
import { useAppSelector } from "@/shared/lib/hooks";

/** Restores user from `/api/auth/me`; baseQuery refreshes on 401, then logout if still failing. */
export const SessionBootstrap: FC = () => {
	const hasSession = Boolean(getAccessToken() || getRefreshToken());
	const inited = useAppSelector((state) => state.user._inited);
	const { setAuthData, logout } = useUserActions();
	const { data, error, isError } = useGetMeQuery(undefined, {
		skip: !inited || !hasSession,
	});

	useEffect(() => {
		if (data) {
			setAuthData(mapApiUserToAuthData(data));
		}
	}, [data, setAuthData]);

	useEffect(() => {
		if (!isError || !error) return;
		const status = "status" in error ? error.status : undefined;
		if (status === 401 || status === 403) {
			logout();
		}
	}, [error, isError, logout]);

	return null;
};
