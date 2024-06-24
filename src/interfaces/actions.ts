type ActionType<T extends string> = { type: T };

interface AttackParticipant {
    id: string;
    activateSpecial?: boolean;
    brave?: boolean;
    effective?: boolean;
    advantage?: boolean | null;
    heal?: number;
    damage?: number;
}

export type TurnStartAction = ActionType<"turn-start"> & {
    [entityId: string]: {
        damage?: number;
        statuses?: string[];
        source?: string;
    }
}

export interface AttackAction {
    type: "attack";
    attacker: AttackParticipant;
    defender: AttackParticipant;
}

export interface KillAction {
    type: "kill";
    target: string;
};

export type BeforeCombatAction = ActionType<"before-combat"> & {
    [entityId: string]: {
        specialName?: string;
        damage?: number;
    }
};

export type AfterCombatAction = ActionType<"after-combat"> & {
    [entityId: string]: {
        damage?: number;
        heal?: number;
        statuses?: string[];
        kill?: boolean;
    }
};

export type MoveAction = ActionType<"move"> & {
    [entityId: string]: {
        x: number;
        y: number;
    }
};

export interface EndTurnAction {
    type: "end-turn";
    newSide: string;
    turnCount: number;
}

export type EndCharacterActionAction = ActionType<"end-action"> & {
    status?: string[];
}

export type Action = AttackAction | BeforeCombatAction | AfterCombatAction | MoveAction | EndTurnAction | EndCharacterActionAction | KillAction | TurnStartAction;
