import Hero from "../entities/hero";

interface WeaponDict {
    [k: string]: {
        description: string;
        might: number;
        range: number;
        onCombatStart?(...args: any[]): any;
        onDamageReceived?(...args: any[]): any;
        onEquip?(...args: any[]): any;
    }
}



type Battle = Turn[];

interface Turn {
    attacker: Hero;
    defender: Hero;
    damage: number;
    order: number; // ordre absolu
    consecutiveOrder: number; // si tours consécutifs, incrémenter ce
}

const PASSIVE_A = {
    "Distant Counter": {
        onCombatStart() {
            return [{ type: "counterattack" }];
        },
        slot: "A"
    },
    "Armored Spd Buff": {
        slot: "C"
    },
    "Swift Slice": {
        slot: "A",
        onInitiateCombat(...args) {
            if (condition) {
                return [{ type: "Effectiveness", }]
            }
        }
    }
}

const WEAPONS: WeaponDict = {
    "Raijinto": {
        description: "Les 1000 Oiseaux",
        might: 16,
        range: 1,
        onCombatStart(state) {
            // if (context.j'ai des amis) {
                return [{ type: "counterattack" }];
            // }
            return []
        }
    },
    "Urvan": {
        might: 14,
        range: 1,
        description: "La hache de la justice",
        onDamageReceived(state, combatState, turnState) {
            if (turnState.consecutiveOrder > 1) {
                return [{ type: "damage-reduction", percentage: 0.8 }];
            }

            if (turnState.order === 1) {
                return [{ type: "damage-reduction", percentage: 0.4 }];
            }
        }
    },
    "Axe of Despair": {
        "description": "Ohlala spooky",
        might: 15,
        range: 2,
        onEquip() {
            return [{ type: "accelerate-special" }];
        },
        onCombatStart(context, combatState: { attacker: Hero }) {

        }
    }
};

export default WEAPONS;
