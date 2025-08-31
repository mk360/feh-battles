interface BattleRoundMessageContent {
    attacker: {
        id: string;
        hp: string;
        cooldown: number;
        damage: number;
        heal: number;
        activatedSpecial: boolean;
    }
    defender: {
        id: string;
        hp: string;
        heal: number;
        cooldown: number;
        activatedSpecial: boolean;
    };
}

class BattleRoundMessage implements EngineMessage<BattleRoundMessageContent> {
    parse(content) {
        return `attack ${content.attacker.id} ${content.attacker.hp} ${content.attacker.cooldown} ${+content.attacker.activatedSpecial} ${content.defender.id} ${content.defender.hp} ${content.defender.cooldown} ${+content.defender.activatedSpecial} ${content.defender.heal}`;
    }
}

interface EngineMessage<T> {
    parse(input: T): string;
}


