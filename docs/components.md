These are the Component the Engine currently uses. This is an auto-generated documentation.

| Component                      | Description                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| AccelerateSpecial              | A Combat round usually decreases the Special countdown by 1. Having this Component increases the drop by 1.                          |
| AfterCombatHeal                | Healing that is applied after combat ends (ex. Breath of Life)                                                                       |
| AllySupport                    | Support rank between allies                                                                                                          |
| AoEDamage                      | Damage from AoE specials, skills that damage opponents outside of combat (for ex. Poison Strike)                                     |
| AoETarget                      | Target for an AoE special                                                                                                            |
| ApplyAffinity                  | Determines the affinity an attacker applies to the defender.                                                                         |
| AssistTile                     | Tiles where a hero can apply an Assist                                                                                               |
| Assist                         | The Assist skill of the hero                                                                                                         |
| Assisted                       | Hero targeted by an Assist                                                                                                           |
| Assisting                      | Hero initiating the Assist                                                                                                           |
| AttackTile                     | Tile that a Hero could theoretically attack                                                                                          |
| Bane                           | Bane stat                                                                                                                            |
| Battling                       | Denotes a Hero that is currently in combat.                                                                                          |
| BeforeCombatDamage             | (currently unused) Deals Map Damage before the combat begins                                                                         |
| Boon                           | Stat boon of a Hero                                                                                                                  |
| BraveWeapon                    | Allows a Hero to attack twice uninterrupted before the Spd check                                                                     |
| CombatBuff                     | Stackable stat buffs that apply for a combat                                                                                         |
| CombatDebuff                   | Stackable stat debuffs that apply for a combat                                                                                       |
| CombatHeal                     | Healing that happens during a combat round                                                                                           |
| Counterattack                  | Allow the defender to counterattack and bypass any limiting check.                                                                   |
| DamageIncrease                 | Damage increase that applies to every attack during combat                                                                           |
| DamageReduction                | Damage decrease that applies in all of the combat. Percentage is subtractive (if a skill reduces damage by 70%, set property to 0.7) |
| DealDamage                     | Main Component used to report a Combat round outcome                                                                                 |
| Desperation                    | Applies the "Desperation" effect (attack twice before foe can counterattack).                                                        |
| DrawBack                       | (TODO) Retreat Hero by 1 tile towards the specified Coordinates                                                                      |
| Effectiveness                  | Effective against the specified Movement Type or Weapon Type                                                                         |
| FinishedAction                 | The Hero has finished their action and cannot act anymore.                                                                           |
| ForceSurvival                  | Guarantee that the Hero survives with 1 HP if dealt a lethal blow.                                                                   |
| ForcedSurvival                 | This Hero has survived a lethal blow but can't activate the effect again.                                                            |
| Galeforce                      | The Hero can consume this Component to act again.                                                                                    |
| Galeforced                     | The Hero has acted again using Galeforce. Prevents Galeforce from activating again for this turn.                                    |
| GravityComponent               | Component that applies the "Gravity" status effect.                                                                                  |
| GuaranteedAffinity             | Skip Affinity calculation and hit with the highest Affinity possible.                                                                |
| GuaranteedFollowup             | Skip follow-up calculations and guarantee a follow-up (not a counterattack).                                                         |
| Heal                           | Standard Heal effect outside of combat.                                                                                              |
| HeroMerge                      | Hero merge count (0 to 10)                                                                                                           |
| Immunity                       | Prevents Effectiveness effects on the specified Movement Type or Weapon Type.                                                        |
| InitiateCombat                 | Marks the Hero that initiated the Combat.                                                                                            |
| Kill                           | This Hero is dead and will be cleaned up.                                                                                            |
| MapBuff                        | Out-of-combat buffs that don't stack.                                                                                                |
| MapDamage                      | Damage that is inflicted outside of combat (AoE, Poison Strike, etc.).                                                               |
| MapDebuff                      | Out-of-combat buffs that don't stack.                                                                                                |
| ModifySpecialCooldown          | Change the special cooldown cap (e.g. with skills that accelerate or slow special cooldowns).                                        |
| Movable                        | Marks a Hero whose movement and attack ranges are currently under computation.                                                       |
| Move                           | Make a Hero move into specified coordinates.                                                                                         |
| MovementTile                   | Set of coordinates where a Hero can move.                                                                                            |
| MovementType                   | Movement Type from Hero's properties                                                                                                 |
| Name                           | Hero's display name.                                                                                                                 |
| NeutralizeAccelerateSpecial    | If opponent has "AccelerateSpecial", neutralize the effects of that Accelerate.                                                      |
| NeutralizeAffinity             | Always return a neutral affinity regardless of other modifiers.                                                                      |
| NeutralizeMapBuffs             | Neutralize an opponent's Map Buffs in all of the stats, or in specified stats.                                                       |
| NeutralizeNormalizeStaffDamage | If opponent has "calculate staff damage like other weapons" effect, neutralize it.                                                   |
| NeutralizeSlowSpecial          | If Hero has this component and a "Slow Special" effect on them, remove them both.                                                    |
| NormalizeStaffDamage           | Make the Hero deal staff damage like other weapons.                                                                                  |
| Obstruct                       | One Component added to the Hero = one Tile they can't cross.                                                                         |
| Pivot                          | Runs an effect similar to the Pivot assist (Hero moves past an ally by one tile).                                                    |
| Position                       | Current coordinates for any Hero.                                                                                                    |
| PreventCounterattack           | If attacker prevents a defender from counterattacking, assign this component to the attacker.                                        |
| PreventDamageReduction         | Disables any DamageReduction the opponent may have.                                                                                  |
| PreventEnemyAlliesInteraction  | Prevent enemy allies from applying their skills to opponent.                                                                         |
| PreventFollowup                | Disable any effect allowing the opponent to make a follow-up, or neutralizes a Guaranteed Follow-up.                                 |
| PreventTargetLowestDefense     | Disables a "Target Lowest Defense" effect the opponent might have.                                                                   |
| PreviewAssist                  | Heroes who run an Assist Preview                                                                                                     |
| PreviewHP                      | HP post-assist preview.                                                                                                              |
| PreviewingBattle               | Denotes Heroes that participate in a combat preview.                                                                                 |
| Refresher                      | A Hero who has a skill that grants another action (Dance, Sing and their variants).                                                  |
| Reposition                     | Applies an effect similar to the Reposition assist. Hero moves another to their opposite side.                                       |
| RoundDamageIncrease            | Increases damage just for one round (either an absolute value or a % of the initial damage amount)                                   |
| RoundDamageReduction           | Decreases damage just for one round (either an absolute value or a % of the initial damage amount)                                   |
| Side                           | A Hero's team.                                                                                                                       |
| Skill                          | Generic Skill slot                                                                                                                   |
| SlowSpecial                    | Reduces special cooldown by 1 (usually only applies once).                                                                           |
| Special                        | A Hero's Special.                                                                                                                    |
| StartingHP                     | Hero's HP at the start of a combat.                                                                                                  |
| Stats                          | Hero's current Stats.                                                                                                                |
| Status                         | Generic component that denotes a Status. Used by the UI to simplify Status display.                                                  |
| Swap                           | Runs the Swap effect. Hero and target swap tiles.                                                                                    |
| TargetLowestDefense            | Assign to attacker. Uses defender's lowest defense regardless of weapon type.                                                        |
| TargetableTile                 | Tiles that have an enemy that a Hero can actually fight.                                                                             |
| TemporaryPosition              | Position that is considered for temporary calculations (assist preview, combat preview).                                             |
| WarpTile                       | Tile where a Hero could potentially warp to.                                                                                         |
| Weapon                         | Technical properties of the Hero's Weapon.                                                                                           |

Undocumented components: SacrificeHP, Shove.