# Game Architecture

## History

This game engine was first designed using a classical Object-Oriented Programming approach. Each hero would be their own class, with properties filled as we go with skills, movement type, weapon type, etc.

But I had to find a way to describe FEH's effects, in a way that allows for a "allow / neutral / disallow" mechanism. So I came up with the concept of Cursors.

So a Cursor is simply a stateful class that stores a number. That number would be used for two purposes:

- Activate or deactivate an effect.
- Add or subtract a fixed amount specified by the Cursor.

The issue is, I had to figure out how to make battle previews, which should be stateless and be computed separately. Simply clone the whole Hero, so that the Cursors attached to them would not point to the main class. Problem solved.

That turned out to be a very naive approach for a few reasons:

- Huge memory consumption. FEH has a lot of varied effects and each effect is ruled by a Cursor. So for x Heroes on the field, I have around 20x the amount of cursors, the majority of which wouldn't be used. With each Cursor having 4 operations to change the numerical value, we'd end up with 80x the amount of functions per Hero, so up to 640x, assuming a standard 8-Hero, 4v4 battle.
- High Garbage Collector activity. I'm duplicating an object filled with a lot of properties and references. I'm actually duplicating two objects, since a preview needs two Heroes to work. Then these objects need to be destroyed, and I could slow the game down by repeatedly allocating memory and making GC sweeps.
- In the long term, operations involving multiplicative and flat damage reduction will not work, because they share the same Cursor (which would be easy to fix, create a new Cursor). If I need to multiply a certain cursor by 0.5 and then add 1 or 5, I better make sure the addition and multiplication come in the correct order, or else the whole combat breaks.
- Since FEH is very complex and each skill can modify any mechanic behavior at any time, trying to work out how to pass the references for these mechanics and influencing them grew to be a nightmare.
- At a certain point, even basic checks became difficult: when I click on a Hero, I can see who are they weak against, and who are they effective against. How would I check if a certain Hero is effective on another? I would have to actually _run_ the skill effects, in a context where I just need a preview. That was a big deal-breaker, and a complete redesign was in order.

## Current Framework and methodology

The Game now uses the Entity-Component-System Architecture: Heroes are divided into stateless Entities. They receive Components which describe a specific feature of these Heroes: their Name, their Weapon Type, their Movement Type, all are separate "blocks" that combine into making a Hero. Systems then query Entities by their relevant Components and run the logic within. Multiple Systems can query the same Component type, so make sure your systems don't step on each other's toes.

For example, Reinhardt: Thunder's Fist is an Entity who receives his Name as a Component, his WeaponType as its own Component, and his Stats and his MovementType in the same manner. If he initiates a combat with Death Blow 3, he receives a "CombatBuff" component which describes the buffs he gets (+6 Atk).

A Combat System would then compute his stats using the Stats component, and the CombatBuff component that was already set beforehand. The System would then proceed using the same methodology for the rest of the logic (weapon triangle, affinity, effectiveness, etc.).

The Effectiveness example above? If a Hero equips a skill that has an effectiveness, an Effectiveness component is added to the Entity. Then it's a matter of two ifs: if the Effectiveness matches an enemy's movement type or if the Effectiveness matches an enemy's weapon type, that's it, you're done. Things do get a little more complex when immunities are involved, but Heroes usually have a single Immunity, thus the added Immunity check is pretty negligible. And as a cherry on top, it's a function that can easily be isolated and will in no way, shape or form, affect the main Entity.

### Pros and cons (in the specific context of FEH)

Let's start with the Pros:

- Any Hero can be described with any combination of the initial components we mentioned. Any permanent effect (such as, as I mentioned, Effectiveness against a movement or weapon type) can be applied as its own component as well. More of an ECS thing than FEH, but still relevant.
- All the effects a skill can apply can be lumped on the entity as Components, which then get consumed by their specific Systems at any point in the game loop.
- The most complex data structure I need to maintain is a Set of Objects. No more class functions which then need to be rescoped and re-bound and take some space, only to never run at all.
- Total freedom over the amount of Components that can be used to describe any similar behaviors: start-of-turn healing can be represented in a component that's different to in-combat healing (Aether, Sol, Daylight, etc.), that is in turn different to after-combat healing or damage.
- More of a library thing than FEH or ECS related, but the tiny memory footprint the game consumes thanks to Components and Entities being basic JS objects is a huge improvement over the previous bloated functions. The library exploits the "object equality by reference" concept in JavaScript to create an efficient memory management mechanism, as well as being full of Sets and Maps which guarantee protection against data duplication. And since Components are pure Objects, the Skills logic can live elsewhere.
- Components can be added and removed on the fly, so a Combat Preview would only need to add then remove the temporary components (e.g. Combat Buffs) after it has finished computing the preview.
