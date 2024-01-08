# Game Architecture

## Terminology

- Combat: the phase where two opposing units interact and fight against each other.
- Combat Round or Turn: the unit of time inside a Combat, where a single unit attacks and a single unit defends. Combats are made of one or several Combat Rounds.
- Battle: the overall battle state, with its map, teams, members, their own states, etc.

## History

This game engine was first designed using a classical Object-Oriented Programming approach. Each hero would be their own class, with properties filled as we go with skills, movement type, weapon type, etc. But I had to find a way to describe FEH's effects, in a way that allows for a "allow / neutral / disallow" mechanism. So I came up with the concept of Cursors.

So a Cursor is simply a stateful class that stores a number. That number would be used for two purposes:

- Activate or deactivate an effect.
- Run arithmetic operations specified by the Cursor.

The issue is, I had to figure out how to make battle previews, which should be stateless and be computed separately. Simply clone the whole Hero, so that the Cursors attached to them would not point to the main class. Problem solved.

That turned out to be a naive approach for a few reasons:

- Huge memory consumption. FEH has a lot of varied effects and each effect is ruled by a Cursor. So for x Heroes on the field, I have around 20x the amount of cursors, the majority of which wouldn't be used. With each Cursor having 7 operations to change the numerical value (raise, lower, reset, as well as the classic arithmetic functions), we'd end up with 140x the amount of functions per Hero, so up to 1120, assuming a standard 8-Hero, 4v4 battle.
- High Garbage Collector activity. I'm duplicating two objects, each filled with a lot of properties and references, since a preview needs two Heroes to work. Then these objects need to be destroyed, and I could slow the game down by repeatedly allocating memory and making GC sweeps.
- In the long term, operations involving multiplicative and flat damage reduction will not work, because they share the same Cursor (which would be easy to fix, create a new Cursor and increase the memory footprint). If I need to multiply a certain cursor by 0.5 and then add 1 or 5, I better make sure the addition and multiplication come in the correct order - which I have no guarantee of - or else the whole combat breaks.
- Since FEH is very complex and each skill can modify any mechanic behavior at any time, trying to work out how to pass the references for these mechanics, influencing them, making sure their interactions were stable, all this grew to be a nightmare.
- At a certain point, even basic checks became difficult: when I click on a Hero, I can see who are they weak against, and who are they effective against. How would I check if a certain Hero is effective on another? I would have to actually _run_ the skill effects, in a context where I just need a preview. That was a big deal-breaker, and a complete redesign was in order.

## Current Framework and methodology

The Game now uses the Entity-Component-System Architecture: Heroes are divided into stateless Entities. They receive Components which describe a specific feature of these Heroes: their Name, their Weapon Type, their Movement Type, all are separate "blocks" that combine into making a Hero. Systems then query Entities by their relevant Components and run the logic within. Multiple Systems can query the same Component type, so make sure your systems don't step on each other's toes.

For example, Ike: Brave Mercenary is an Entity who receives his Name as a Component, his WeaponType as its own Component, and his Stats and his MovementType in the same manner. If he initiates a combat with Death Blow 3, he receives a "CombatBuff" component which describes the buffs he gets (+6 Atk).

A Combat System would then compute his stats using the Stats component, and the CombatBuff component that was already set beforehand. The System would then proceed using the same methodology for the rest of the logic (weapon triangle, affinity, effectiveness, etc.).

The Effectiveness example above? If a Hero equips a skill that has an effectiveness, an Effectiveness component is added to the Entity. Then it's a matter of two ifs: if the Effectiveness component matches an enemy's movement type or if the Effectiveness matches an enemy's weapon type, that's it, you're done. Things do get a little more complex when immunities are involved, but Heroes usually have a single Immunity, thus the added Immunity check is pretty negligible. And as a cherry on top, it's a function that can easily be isolated and will in no way, shape or form, affect the main Entity.

### Pros and cons (in the specific context of FEH)

Let's start with the Pros:

- Any Hero can be described with any combination of the initial components we mentioned. Any permanent effect (such as, as I mentioned, Effectiveness against a movement or weapon type) can be applied as its own component as well. More of an ECS thing than FEH, but still relevant.
- All the effects a skill can apply can be lumped on the entity as Components, which then get consumed by their specific Systems at any point in the game loop.
- The most complex data structure I need to maintain is a Set of Objects. No more class functions which then need to be rescoped and re-bound and take some space, only to never run at all.
- Total freedom over the amount of Components that can be used to describe any similar behaviors: start-of-turn healing can be represented in a component that's different to in-combat healing (Aether, Sol, Daylight, etc.), that is in turn different to after-combat healing or damage.
- More of a library thing than FEH or ECS related, but the tiny memory footprint the game consumes thanks to Components and Entities being basic JS objects is a huge improvement over the previous bloated functions. The library exploits reference equality in JavaScript to create an efficient memory management mechanism, as well as being full of Sets and Maps which guarantee protection against data duplication. And since Components are pure Objects, the Skills logic can live elsewhere.
- Components can be added and removed on the fly, so a Combat Preview would only need to add then remove the temporary components (e.g. Combat Buffs) after it has finished computing the preview.

### Cons

- A clear direction needs to be provided when assigning components. Since a lot of behaviors affect the unit in relation to their enemy (for example, guaranteed or prevented follow-up), it's really important to make sure component assignments stay consistent in their receiving entity.
Components need to be assigned to their actors, not to their targets: if Unit 1 prevents Unit 2 from counterattacking, the "PreventCounterattack" component should go to Unit1. If Unit 2 prevents Unit 1 from making follow-ups, Unit 2 receives the "PreventFollowup" component. And so on.
- ECS is more suited to real-time games who need to evaluate their state frame by frame. The nature of a turn-based game makes it so that any logic or behavior can be created in custom functions, which can be hard to reconcile with the framework's ecosystem.
- Given that this package contains the Game World that will directly interact with external integrations, extra care should be taken to design a proper interactive API.

## Game Logic

It's no surprise that since the game's launch in 2017, Skills started simple and then went on to become more and more convoluted, requiring stacking damage reduction calculations, buffs and debuffs that rely on some weird criteria, or completely new mechanics and status effects.

Luckily, however complex they could be, they still rely on "blocks" or "parts" that get assembled and combined with each other.

Let's take [Axebreaker 3](https://feheroes.fandom.com/wiki/Axebreaker). The skill breaks down to the following:

- If the enemy has a specific weapon,
- And unit meets a certain health threshold,
- Add an effect that guarantees followups to unit,
- And add an effect to unit preventing the enemy to make followups.

This pattern is seen and used across three levels of the same skill, where the only difference is the health threshold, which is why it can be isolated into its own generic function. This pattern is also used across different weapon types (Swordbreaker, Lancebreaker, Bowbreaker), so the function can also take into account a variation in weapons.

And now what happens is whenever a Skill has this "breaker" effect baked into it, we can just throw this function and guarantee the behavior we need. A single function, with enough flexibility, covered for 18 "simple" skills, and countless others more, with the obvious benefits of the DRY principle. Build [enough functions for each effect](./data/effects.ts), and what you end up with is an immense variety of Skills that can be composed with these simple blocks.

## Game Data

### Characters

Characters are parsed straight from a [JSON file](./data/characters.json). The file contains identifying information, Weapon Type and Color, Movement Type, as well as Level 1 Stats and Growth Rates.

### Skills and Skill Hooks

Skills are packed inside Skilldexes (open to name suggestions), such as [Passives](./data/passives.ts) and [Weapons](./data/weapons.ts). A Skill has its mandatory identifying information, such as name, slot and description, with details varying depending on skill type (Weapons have a Might, Assists have a Range, etc.).

In order to express their effects, these Skills rely on Event Hooks (referred to as Skill Hooks) that get called when the engine reaches a certain matching event. For example, on Turn Start, all Skills with an `onTurnStart` hook get called.

Combat Skill Hooks distinguish between whether you're the initiator or the defender at the start of combat: the example Death Blow above only applies when initiating, so it receives an `onCombatInitiate` hook. Same goes for defensive hooks, and so on. There are certain skills, such as Specials, that only trigger when a Combat Round is reached _and_ the unit is in a certain position: Specials such as Aether trigger when unit attacks during the Round, so they receive an `onCombatRoundAttack` hook.

Hooks' naming follows a "least-to-most-precise" naming convention. Dissecting the `onCombatRoundAttack` gives us:

- `on` a certain event,
- which is a `Combat`,
- during a Combat `Round`,
- when in position to `Attack` during that round.

Not the most English, but it's pretty consistent most of the time. A list of common Skill Hooks includes:

- `onEquip`: Runs when the skill is first equipped to the unit. Effectiveness, stat changes, or any permanent effect goes here.
- `onTurnStart`: Runs when a new turn starts. Takes the current Battle State (from which you can access turn count, current team, team composition, etc) as an argument.
- `onCombatStart`: Runs when this skill's wielder enters a combat, regardless of the side.
- `onCombatInitiate`: Runs when this skill's wielder initiates the combat.
- `onCombatDefend`: Runs when an enemy initiates combat against this skill's wielder.
- `onCombatAllyStart`: Runs when an ally of this skill's wielder enters a combat, regardless of the side.
- `onCombatAllyInitiate`: Runs when an ally of this skill's wielder initiates combat against their enemy.
- `onCombatAllyDefend`: Runs when an enemy initiates combat against an ally of this skill's wielder.

## Game State

### Map Representation

A 8x6 1-indexed Object of `Uint16Array`s represents the global map topology: coordinates, whether a Hero occupies it, what kind of tile are we on, does it have a trench, a defensive tile.... All this is packed into a 16-bit bitfield, which, in detail, goes as follows:

- Lowest 4 bits are the Tile Type. 4 bits are used despite having just 4 tile types (which could fit into 3 bits), as each bit represents one of the 4 movement types that could legally reach the tile (so a Plain has a bitfield of 0b1111). Walls and other blocking structures have a bitfield of 0, preventing any movement on them.
- Next 2 bits (5-6) are used to determine if the tile is occupied, and by which team. This group is set to 0 if the tile is free, 1 if Team 1 occupies it and 0b10 if Team 2 is on it. Since 0b11 is unused, we could create a third team.....?
- Next 3 (7-9) bits are used to encode the x coordinate, from 1 to 6.
- Next 3 (10-13) bits are used to encode the y coordinate, from 0 to 7 (0b111). The y-coordinate is 0-indexed to pack 8 values into 3 bits. These coordinate bits might be deprecated. If deprecated, these 6 bits could be replaced by a team slot bitfield (e.g. if the value is 0b10, that means the unit on this tile is the 2nd of its team, which could help tighten up state validation).
- 14th bit determines whether the tile is a trench. While technically a tile type, it still uses a bit, and has special treatment regarding cavalry movement.
- 15th bit is for defensive tiles. Defensive tiles grant Damage Reduction to units who occupy such a tile.

A single spare bit is still left, but I doubt it will be of use.

### Skill Maps

So I met an interesting problem. Let's say I want to run any `onCombatInitiate` Skill Hook on two units who are battling. Since a unit has up to 7 Skill Slots, that makes 14 checks that are guaranteed to run less than 5 Hooks total. So that's a 64% of potential skills that was not executed. And that's just for one hook. So I had to come up with a more time-efficient way of running these skill hooks.

Enter, Skill Maps. Each Entity (Hero) is mapped to their Skill Hooks, with each Hook containing all the Components whose matching Skills contain this hook.

Back to the Death Blow example, Ike's Skill Map would be:

```
-> Create Ike: Brave Mercenary
-> Ike: Brave Mercenary has Death Blow 3 as a Skill
-> Create Skill Component
-> Look up skill, find out that it has an onCombatInitiate hook.
-> Create Skill Map with Ike: Brave Mercenary as a key, and as a value, create an object with the key onCombatInitiate.
-> Add the created component to the object.
```

```
Ike: Brave Mercenary initiates combat.
-> Get Entity from Skill Map, find an object with the "onCombatInitiate" key.
-> onCombatInitiate: Set of 1 Component
-> Component represents Death Blow 3.
-> Look up Death Blow 3 inside SkillDex, run onCombatInitiate.
```

This approach guarantees that we only:

- Limit the stored effects to what's necessary.
- Guarantee that we only run the few effects that directly relate to the current engine event.

This will probably cause extra memory consumption, and perhaps some aspects of it could be refined. But for now, I think this is a very good starting point.
