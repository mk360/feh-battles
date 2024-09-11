export const POSITIVE_STATUSES = ["Bonus", "Guidance", "Increased Movement"] as const;
export const NEGATIVE_STATUSES = ["Penalty", "Gravity", "Panic", "Guard", "Prevent Counterattack"] as const;

export const STATUSES = [...POSITIVE_STATUSES, ...NEGATIVE_STATUSES] as const;

