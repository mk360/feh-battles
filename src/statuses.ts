export const POSITIVE_STATUSES = ["Bonus", "Guidance", "Increased Movement"] as const;
export const NEGATIVE_STATUSES = ["Penalty", "Gravity", "Panic", "Guard"] as const;

export const STATUSES = [...POSITIVE_STATUSES, ...NEGATIVE_STATUSES] as const;
