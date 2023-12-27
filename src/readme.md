## Terminology

- Combat: the phase where two opposing units interact and fight against each other.
- Combat Round: the unit of time inside a Combat, where a single unit attacks and a single unit defends. Combats are made of one or several Combat Rounds.
- Battle: the overall battle state, with its map, teams and their states, etc.

### Skills Definition

- `protects`: Provides immunity against effects that are effective against the specified movement type or weapon type (ex. Svalinn Shield protects armored units, so Svalinn Shield would have a `protects: ["armored"]` property).

### Skill Hooks

All Skill Hooks are automatically bound to their Skill component. Use standard function declarations instead of arrow functions.

- `onEquip`: Runs when the skill is first equipped to the unit. Effectiveness, stat changes, or any permanent effect goes here.
- `onTurnStart`: Runs when a new turn starts. Takes the current Battle State (from which you can access turn count, current team, team composition, etc) as an argument.
- `onCombatStart`: Runs when this skill's wielder enters a combat, regardless of the side.
- `onCombatInitiate`: Runs when this skill's wielder initiates the combat.
- `onCombatDefend`: Runs when an enemy initiates combat against this skill's wielder.
- `onCombatAllyStart`: Runs when an ally of this skill's wielder enters a combat, regardless of the side.
- `onCombatAllyInitiate`: Runs when an ally of this skill's wielder initiates combat against their enemy.
- `onCombatAllyDefend`: Runs when an enemy initiates combat against an ally of this skill's wielder.

## Developing new effects

- Create a component
- Register it in the GameWorld
- Assign each component to the entity whose behavior it should affect: while it seems obvious, behaviors like "guaranteed follow-up" and "prevent counterattack" could be assigned to both an attacker and a defender, hence the distinction.
- If an attacker has guaranteed followup, assign the "guaranteed follow-up" effect to the attacker. If the defender can prevent a follow-up, add the "prevent follow-up" effect to the defender.
