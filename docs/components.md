These are the Component the Engine currently uses. This is an auto-generated documentation.

| Component            | Description                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| AccelerateSpecial    | A Combat round usually decreases the Special countdown by 1. Having this Component increases the drop by 1.                          |
| AfterCombatHeal      | Healing that is applied after combat ends (ex. Breath of Life)                                                                       |
| AllySupport          | Support rank between allies                                                                                                          |
| AoEDamage            | Damage from AoE specials, skills that damage opponents outside of combat (for ex. Poison Strike)                                     |
| AoETarget            | Target for an AoE special                                                                                                            |
| ApplyAffinity        | Determines the affinity an attacker applies to the defender.                                                                         |
| AssistTile           | Tiles where a hero can apply an Assist                                                                                               |
| Assist               | The Assist skill of the hero                                                                                                         |
| Assisted             | Hero targeted by an Assist                                                                                                           |
| Assisting            | Hero initiating the Assist                                                                                                           |
| AttackTile           | Tile that a Hero could theoretically attack                                                                                          |
| Bane                 | Bane stat                                                                                                                            |
| Battling             | Denotes a Hero that is currently in combat.                                                                                          |
| BeforeCombatDamage   | (currently unused) Deals Map Damage before the combat begins                                                                         |
| Boon                 | Stat boon of a Hero                                                                                                                  |
| BraveWeapon          | Allows a Hero to attack twice uninterrupted before the Spd check                                                                     |
| CombatBuff           | Stackable stat buffs that apply for a combat                                                                                         |
| CombatDebuff         | Stackable stat debuffs that apply for a combat                                                                                       |
| CombatHeal           | Healing that happens during a combat round                                                                                           |
| Counterattack        | Allow the defender to counterattack and bypass any limiting check.                                                                   |
| DamageIncrease       | Damage increase that applies to every attack during combat                                                                           |
| DamageReduction      | Damage decrease that applies in all of the combat. Percentage is subtractive (if a skill reduces damage by 70%, set property to 0.7) |
| DealDamage           | Main Component used to report a Combat round outcome                                                                                 |
| Desperation          | Applies the "Desperation" effect (attack twice before foe can counterattack).                                                        |
| DrawBack             | (TODO) Retreat Hero by 1 tile towards the specified Coordinates                                                                      |
| Effectiveness        | Effective against the specified Movement Type or Weapon Type                                                                         |
| FinishedAction       | The Hero has finished their action and cannot act anymore.                                                                           |
| ForceSurvival        | Guarantee that the Hero survives with 1 HP if dealt a lethal blow.                                                                   |
| ForcedSurvival       | This Hero has survived a lethal blow but can't activate the effect again.                                                            |
| Galeforce            | The Hero can consume this Component to act again.                                                                                    |
| Galeforced           | The Hero has acted again using Galeforce. Prevents Galeforce from activating again for this turn.                                    |
| GravityComponent     | Component that applies the "Gravity" status effect.                                                                                  |
| GuaranteedAffinity   | Skip Affinity calculation and hit with the highest Affinity possible.                                                                |
| GuaranteedFollowup   | Skip follow-up calculations and guarantee a follow-up (not a counterattack).                                                         |
| Heal                 | Standard Heal effect outside of combat.                                                                                              |
| HeroMerge            | Hero merge count (0 to 10)                                                                                                           |
| Immunity             | Prevents Effectiveness effects on the specified Movement Type or Weapon Type.                                                        |
| InitiateCombat       | Marks the Hero that initiated the Combat.                                                                                            |
| Kill                 | This Hero is dead and will be cleaned up.                                                                                            |
| PreventCounterattack | If attacker prevents a defender from counterattacking, assign this component to the attacker.                                        |
| Status               | Generic component that denotes a Status. Used by the UI to simplify Status display.                                                  |
| Swap                 | Runs the Swap effect. Hero and target swap tiles.                                                                                    |
| TargetLowestDefense  | Assign to attacker. Uses defender's lowest defense regardless of weapon type.                                                        |
| TargetableTile       | Tiles that have an enemy that a Hero can actually fight.                                                                             |
| TemporaryPosition    | Position that is considered for temporary calculations (assist preview, combat preview).                                             |
| WarpTile             | Tile where a Hero could potentially warp to.                                                                                         |
| Weapon               | Technical properties of the Hero's Weapon.                                                                                           |
