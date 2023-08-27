import Hero from "./hero";

class SpecialManager {
    getCooldownAfterHit(hero: Hero, specialActivated: boolean) {
        if (hero.skills.special.currentCooldown === 0 && specialActivated) {
            return hero.skills.special.baseCooldown;
        }

        const maxCooldownDebuff = Number(hero.getCursorValue("slowCooldown") > 1 || hero.statuses.includes("guard"));
        const maxCooldownBuff = Math.max(hero.getCursorValue("fastCooldown"), 0);

        let cooldownChange = 1 + maxCooldownBuff - maxCooldownDebuff;

        return Math.max(0, hero.skills.special.currentCooldown - cooldownChange);
    }
}

export default SpecialManager;
