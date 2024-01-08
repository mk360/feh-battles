import CombatTurnOutcome from "./combat-turn-outcome";

interface CombatOutcome {
    attacker: {
        id: string;
        turnCount: number;
        effectiveness: boolean;
        damageByTurn: number;
        hp: number;
    };
    defender: {
        id: string;
        turnCount: number;
        effectiveness: boolean;
        damageByTurn: number;
        hp: number;
    };
    turns: CombatTurnOutcome[];
};

export default CombatOutcome;
