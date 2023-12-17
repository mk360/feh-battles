import { Entity } from "ape-ecs";

interface CombatTurnOutcome {
    turnNumber: number;
    consecutiveTurnNumber: number;
    attacker: Entity;
    defender: Entity;
    damage: number;
    attackerSpecialCooldown: number;
    defenderSpecialCooldown: number;
}

export default CombatTurnOutcome;
