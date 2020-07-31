This package aims to reproduce the combat conditions from the mobile game [Fire Emblem Heroes](https://fire-emblem-heroes.com/en/).

### Basics

Fire Emblem Heroes is a mobile turn-by-turn tactical role-playing game, where players possess teams of characters called "heroes" whom they must move across a 8x6 grid and battle other units in order to prevail. Each character can fight using one of many weapons available in the game (swords, bows, and even magic) and comes with a set of statistics and skills which determine their battling ability. Each combat is a fixed-damaged, turn by turn sequence. While a normal sequence usually runs as "each side attacks once", several factors might decide that one of the sides could attack up to 4 times, either consecutively, or separated by one or more enemy counter-attacks. And that's just one simple part of what combats have to offer.

Each hero has the following stats:

- Health Points
- Attack
- Speed
- Defense
- Resistance

The difference in defense and resistance resides in the nature of the received hit: magical attacks are weakened by resistance, physical attacks are weakened by defense.

### Getting started

Install the package, then its dependencies.

### Usage

Create at least two Heroes with either:

- The builder:

```js
const FEH = require("feh-battles");

const hero1 = new FEH.Hero().setName("some name").setBaseStats({ hp: 49, def: 31, res: 17, spd: 27, atk: 35 });
const hero2 = /* same as previous line */
```

Or by passing an object as a constructor:

```js
const hero1 = new FEH.Hero({
    name: "some name",
    stats: {
        hp: 49,
        def: 31,
        res: 17,
        spd: 27,
        atk: 35
    }
});
const hero2 = /* same as previous lines */
```

- Create a few weapons, then assign them to your heroes:

```js
const weapon1 = new FEH.Weapon()
  .setName("epic sword")
  .setMight(20)
  .setCategory("sword");
/* alternate method */
const weapon1 = new FEH.Weapon({
  name: "epic sword",
  might: 20,
  category: "sword",
});

hero1.equipWeapon(weapon1); // hero1 will gain 20 points to his attack stat

const weapon2 = new FEH.Weapon()
  .setName("lesser sword")
  .setMight(14)
  .setCategory("sword");

hero2.equipWeapon(weapon2);
```

If you feel the need to _really_ populate your battlefield, you can assign allies and enemies to both sides - with so far no restriction on wilder scenarios (such as a third hero being an ally of both enemies).

Now that the two opponents are prepared, let's fight:

```js
const combat = new FEH.Combat({ attacker: hero1, defender: hero2 });
const result = combat.createCombat(); // produces the combat results.
```

By creating a new combat, a copy of both attacker and defender are created, so any modification will be reflected on the Combat copies of the heroes, not on the heroes themselves (could be useful for, obvious example, damage tracking).

### Passive skills

Alongside the weapon, a hero can receive up to 3 skills that are labelled "passive skills" - they do interfere in battle, but they're not mandatory to produce damage (in comparison, a hero cannot attack at all if he doesn't wield a weapon, regardless of how sophisticated his other skills might be).

Their effect can be as simple as a permanent stat increase, and can be as complex as reducing damage conceded if hero and opponent are separated by a certain number of tiles while wielding specific weapons.

The package attempts to separate their effects into a few "event handlers":

- Some effects activate before entering a combat as an initiator
- Some effects activate before entering a combat as a defender
- Some effects activate at the start of a turn
- And some effects activate right after a combat is over.

Even allies have their own event handlers.

### Cursors

A core functionality of this package. They determine internally, for a specific combat effect (say, for example, how many times a hero can attack) what behavior that hero will have: will they attack once? Twice? Won't they attack at all? Can they attack before their opponent initiates, can they attack twice, in a row, before their opponent initiates?

The multitude of effects available in this game are represented each by a specific cursor who has a default value (0), value that can be modified (by calling `Hero#raiseCursor` or `Hero#lowerCursor`). Depending on the effect and depending on the final value, a specific behavior might or might not occur.

Despite my focus on turns taken and such, combat is much more vast than that.

Whether they affect the ongoing battle is determined by a few factors:
* What are the possible states of that effect? (attacking could be completely disallowed, or the hero could attack normally, or the hero attacks more often. Buffs obtained during combat can be enabled or disabled.)
* What is the default value of that effect cursor? (0).
* Does this cursor's effect activate only when its value is positive (> 0), or does it still activate even if its value equals zero?
* If this check passes, apply that effect.

### Effects coverage

With Intelligent Systems (the company behind the game) getting more and more creative with custom effects, it gets quite hard to plan for them and cover them all. I can, however, state with enough confidence that this module's effects reproducibility nears the 80% ballpark, which looks good enough to call it a day.

### Pros of this package

Contrary to similar packages you might find, I do not rely on rarely-updated databases in order to make this one work. The user gives the initial data, no matter how surreal or nonsensical it may be, and the rest happens behind the scenes. And, the result is served in an orderly array of sides and numbers, which make for an easy damage reporting or whatever treatment you'd like.

### Cons

- Because this is my first shot at TypeScript, the codebase is still quite the mess. I haven't got around the proper way to define interfaces properly, types, etc.. But hey, it looks cool, and it works, in theory!
- It lacks tests. There are a few tests, they're only covering passive skills and heroes. And even then, they only cover their basic creation, so no complex foolproof interaction scenarios are available for the moment. I do plan on creating more tests, however.
- You cannot emulate Specials nor Assists yet. Specials are.... special (!!!) skills that activate more visibly than passive skills (in-game, with a purple gleam) and give out different, more dramatic effects such as damage reducing, damage increasing, both, health restoration, etc.
  Assists provide either:
- Healing
- Moving across the battlefield ("hoisting" a hero from behind you to, well, in front of you)
- Or increasing one's stats.

In theory, Assists could be easy to implement, but most of them are much more useful in a full battlefield with a graphical interface and what-have-you, so they're not worth the effort for now.
