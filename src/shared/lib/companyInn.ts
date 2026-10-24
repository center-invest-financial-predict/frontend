import { USER_PROFILE } from "@/shared/consts/localStorage";

export const getActiveInn = (): string | null => {
	const raw = localStorage.getItem(USER_PROFILE);
	if (!raw) return null;
	try {
		const profile = JSON.parse(raw) as { business?: { inn?: string } };
		const inn = profile.business?.inn?.trim();
		return inn || null;
	} catch {
		return null;
	}
};
