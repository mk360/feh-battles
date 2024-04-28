declare const SKILLS: {
    [x: string]: {
        description: string;
        might: number;
        displayName?: string;
        type: import("../interfaces/types").WeaponType;
        color?: import("../interfaces/types").WeaponColor;
        exclusiveTo?: ("Abel: The Panther" | "Alfonse: Prince of Askr" | "Alm: Hero of Prophecy" | "Amelia: Rose of the War" | "Anna: Commander" | "Arden: Strong and Tough" | "Arthur: Hapless Hero" | "Arvis: Emperor of Flame" | "Athena: Borderland Sword" | "Ayra: Astra's Wielder" | "Azama: Carefree Monk" | "Azura: Lady of Ballads" | "Azura: Lady of the Lake" | "Barst: The Hatchet" | "Bartre: Fearless Warrior" | "Berkut: Prideful Prince" | "Beruka: Quiet Assassin" | "Black Knight: Sinister General" | "Boey: Skillful Survivor" | "Caeda: Talys's Bride" | "Caeda: Talys's Heart" | "Cain: The Bull" | "Camilla: Bewitching Beauty" | "Camilla: Spring Princess" | "Camus: Sable Knight" | "Catria: Middle Whitewing" | "Cecilia: Etrurian General" | "Celica: Caring Princess" | "Charlotte: Money Maiden" | "Cherche: Wyvern Friend" | "Chrom: Exalted Prince" | "Chrom: Spring Exalt" | "Clair: Highborn Flier" | "Clarine: Refined Noble" | "Clarisse: Sniper in the Dark" | "Clive: Idealistic Knight" | "Cordelia: Knight Paragon" | "Cordelia: Perfect Bride" | "Corrin: Fateful Prince" | "Corrin: Fateful Princess" | "Corrin: Novice Vacationer" | "Deirdre: Lady of the Forest" | "Delthea: Free Spirit" | "Donnel: Village Hero" | "Dorcas: Serene Warrior" | "Draug: Gentle Giant" | "Effie: Army of One" | "Eirika: Restoration Lady" | "Eldigan: Lionheart" | "Elincia: Lost Princess" | "Elise: Budding Flower" | "Elise: Tropical Flower" | "Eliwood: Knight of Lycia" | "Ephraim: Restoration Lord" | "Est: Junior Whitewing" | "Fae: Divine Dragon" | "Faye: Devoted Heart" | "Felicia: Maid Mayhem" | "Fir: Sword Student" | "Florina: Lovely Flier" | "Frederick: Horizon Watcher" | "Frederick: Polite Knight" | "Gaius: Candy Stealer" | "Gaius: Thief Exposed" | "Genny: Endearing Ally" | "Gordin: Altean Archer" | "Gray: Wry Comrade" | "Gunter: Inveterate Soldier" | "Gwendolyn: Adorable Knight" | "Hana: Focused Samurai" | "Hawkeye: Desert Guardian" | "Hector: General of Ostia" | "Henry: Happy Vampire" | "Henry: Twisted Mind" | "Hinata: Wild Samurai" | "Hinoka: Warrior Princess" | "Ike: Brave Mercenary" | "Ike: Young Mercenary" | "Inigo: Indigo Dancer" | "Innes: Regal Strategician" | "Jaffar: Angel of Death" | "Jagen: Veteran Knight" | "Jakob: Devoted Monster" | "Jakob: Devoted Servant" | "Jeorge: Perfect Shot" | "Joshua: Tempest King" | "Julia: Naga's Blood" | "Kagero: Honorable Ninja" | "Karel: Sword Demon" | "Katarina: Wayward One" | "Klein: Silver Nobleman" | "Lachesis: Lionheart's Sister" | "Laslow: Dancing Duelist" | "Legion: Masked Maniac" | "Leo: Seashore's Prince" | "Leo: Sorcerous Prince" | "Leon: True of Heart" | "Lilina: Delightful Noble" | "Linde: Light Mage" | "Lissa: Sprightly Cleric" | "Lloyd: White Wolf" | "Lon'qu: Solitary Blade" | "Lucina: Brave Princess" | "Lucina: Future Witness" | "Lucina: Spring Exalt" | "Lucius: The Light" | "Lukas: Sharp Soldier" | "Luke: Rowdy Squire" | "Lute: Prodigy" | "Lyn: Brave Lady" | "Lyn: Bride of the Plains" | "Lyn: Lady of the Plains" | "Mae: Bundle of Energy" | "Marth: Altean Prince" | "Marth: Enigmatic Blade" | "Mathilda: Legendary Knight" | "Matthew: Faithful Spy" | "Merric: Wind Mage" | "Mia: Lady of Blades" | "Michalis: Ambitious King" | "Minerva: Red Dragoon" | "Mist: Helpful Sister" | "Narcian: Wyvern General" | "Navarre: Scarlet Sword" | "Nephenee: Fierce Halberdier" | "Niles: Cruel to Be Kind" | "Ninian: Oracle of Destiny" | "Nino: Pious Mage" | "Nowi: Eternal Witch" | "Nowi: Eternal Youth" | "Oboro: Fierce Fighter" | "Odin: Potent Force" | "Ogma: Loyal Blade" | "Olivia: Blushing Beauty" | "Olivia: Festival Dancer" | "Olwen: Blue Mage Knight" | "Oscar: Agile Horseman" | "Palla: Eldest Whitewing" | "Priscilla: Delicate Princess" | "Raigh: Dark Child" | "Raven: Peerless Fighter" | "Rebecca: Wildflower" | "Reinhardt: Thunder's Fist" | "Robin: High Deliverer" | "Robin: Mystery Tactician" | "Robin: Seaside Tactician" | "Roderick: Steady Squire" | "Roy: Brave Lion" | "Ryoma: Peerless Samurai" | "Saber: Driven Mercenary" | "Saizo: Angry Ninja" | "Sakura: Gentle Nekomata" | "Sakura: Loving Priestess" | "Sanaki: Begnion's Apostle" | "Selena: Cutting Wit" | "Seliph: Heir of Light" | "Serra: Outspoken Cleric" | "Seth: Silver Knight" | "Setsuna: Absent Archer" | "Shanna: Sprightly Flier" | "Sharena: Princess of Askr" | "Sheena: Princess of Gra" | "Shigure: Dark Sky Singer" | "Sigurd: Holy Knight" | "Sonya: Vengeful Mage" | "Sophia: Nabata Prophet" | "Soren: Shrewd Strategist" | "Stahl: Viridian Knight" | "Subaki: Perfect Expert" | "Sully: Crimson Knight" | "Tailtiu: Thunder Noble" | "Takumi: Wild Card" | "Tana: Winged Princess" | "Tharja: Dark Shadow" | "Tiki: Dragon Scion" | "Tiki: Naga's Voice" | "Tiki: Summering Scion" | "Titania: Mighty Mercenary" | "Tobin: The Clueless One" | "Ursula: Blue Crow" | "Valter: Dark Moonstone" | "Virion: Elite Archer" | "Wrys: Kindly Priest" | "Xander: Paragon Knight" | "Xander: Spring Prince" | "Xander: Student Swimmer" | "Zephiel: The Liberator")[];
        effectiveAgainst?: (import("../interfaces/types").WeaponType | import("../interfaces/types").MovementType)[];
        protects?: (import("../interfaces/types").WeaponType | import("../interfaces/types").MovementType)[];
        onCombatStart?(this: import("../components/skill").default, battleState: import("../systems/state").default, target: import("ape-ecs").Entity): void;
        onCombatAfter?(this: import("../components/skill").default, battleState: import("../systems/state").default, target: import("ape-ecs").Entity, combat: import("../interfaces/combat-outcome").default): void;
        onCombatInitiate?(this: import("../components/skill").default, state: import("../systems/state").default, target: import("ape-ecs").Entity): void;
        onCombatAllyStart?(this: import("../components/skill").default, state: import("../systems/state").default, ally: import("ape-ecs").Entity): void;
        onCombatDefense?(this: import("../components/skill").default, state: import("../systems/state").default, attacker: import("ape-ecs").Entity): void;
        onCombatRoundDefense?(this: import("../components/skill").default, enemy: import("ape-ecs").Entity, combatRound: Partial<import("../interfaces/combat-turn-outcome").default>): void;
        onEquip?(this: import("../components/skill").default): any;
        onTurnStart?(this: import("../components/skill").default, battleState: import("../systems/state").default): void;
    } | {
        description: string;
        slot: import("../interfaces/types").PassiveSlot;
        allowedMovementTypes?: import("../interfaces/types").MovementType[];
        allowedWeaponTypes?: import("../interfaces/types").WeaponType[];
        allowedColors?: import("../interfaces/types").WeaponColor[];
        protects?: (import("../interfaces/types").WeaponType | import("../interfaces/types").MovementType)[];
        exclusiveTo?: ("Abel: The Panther" | "Alfonse: Prince of Askr" | "Alm: Hero of Prophecy" | "Amelia: Rose of the War" | "Anna: Commander" | "Arden: Strong and Tough" | "Arthur: Hapless Hero" | "Arvis: Emperor of Flame" | "Athena: Borderland Sword" | "Ayra: Astra's Wielder" | "Azama: Carefree Monk" | "Azura: Lady of Ballads" | "Azura: Lady of the Lake" | "Barst: The Hatchet" | "Bartre: Fearless Warrior" | "Berkut: Prideful Prince" | "Beruka: Quiet Assassin" | "Black Knight: Sinister General" | "Boey: Skillful Survivor" | "Caeda: Talys's Bride" | "Caeda: Talys's Heart" | "Cain: The Bull" | "Camilla: Bewitching Beauty" | "Camilla: Spring Princess" | "Camus: Sable Knight" | "Catria: Middle Whitewing" | "Cecilia: Etrurian General" | "Celica: Caring Princess" | "Charlotte: Money Maiden" | "Cherche: Wyvern Friend" | "Chrom: Exalted Prince" | "Chrom: Spring Exalt" | "Clair: Highborn Flier" | "Clarine: Refined Noble" | "Clarisse: Sniper in the Dark" | "Clive: Idealistic Knight" | "Cordelia: Knight Paragon" | "Cordelia: Perfect Bride" | "Corrin: Fateful Prince" | "Corrin: Fateful Princess" | "Corrin: Novice Vacationer" | "Deirdre: Lady of the Forest" | "Delthea: Free Spirit" | "Donnel: Village Hero" | "Dorcas: Serene Warrior" | "Draug: Gentle Giant" | "Effie: Army of One" | "Eirika: Restoration Lady" | "Eldigan: Lionheart" | "Elincia: Lost Princess" | "Elise: Budding Flower" | "Elise: Tropical Flower" | "Eliwood: Knight of Lycia" | "Ephraim: Restoration Lord" | "Est: Junior Whitewing" | "Fae: Divine Dragon" | "Faye: Devoted Heart" | "Felicia: Maid Mayhem" | "Fir: Sword Student" | "Florina: Lovely Flier" | "Frederick: Horizon Watcher" | "Frederick: Polite Knight" | "Gaius: Candy Stealer" | "Gaius: Thief Exposed" | "Genny: Endearing Ally" | "Gordin: Altean Archer" | "Gray: Wry Comrade" | "Gunter: Inveterate Soldier" | "Gwendolyn: Adorable Knight" | "Hana: Focused Samurai" | "Hawkeye: Desert Guardian" | "Hector: General of Ostia" | "Henry: Happy Vampire" | "Henry: Twisted Mind" | "Hinata: Wild Samurai" | "Hinoka: Warrior Princess" | "Ike: Brave Mercenary" | "Ike: Young Mercenary" | "Inigo: Indigo Dancer" | "Innes: Regal Strategician" | "Jaffar: Angel of Death" | "Jagen: Veteran Knight" | "Jakob: Devoted Monster" | "Jakob: Devoted Servant" | "Jeorge: Perfect Shot" | "Joshua: Tempest King" | "Julia: Naga's Blood" | "Kagero: Honorable Ninja" | "Karel: Sword Demon" | "Katarina: Wayward One" | "Klein: Silver Nobleman" | "Lachesis: Lionheart's Sister" | "Laslow: Dancing Duelist" | "Legion: Masked Maniac" | "Leo: Seashore's Prince" | "Leo: Sorcerous Prince" | "Leon: True of Heart" | "Lilina: Delightful Noble" | "Linde: Light Mage" | "Lissa: Sprightly Cleric" | "Lloyd: White Wolf" | "Lon'qu: Solitary Blade" | "Lucina: Brave Princess" | "Lucina: Future Witness" | "Lucina: Spring Exalt" | "Lucius: The Light" | "Lukas: Sharp Soldier" | "Luke: Rowdy Squire" | "Lute: Prodigy" | "Lyn: Brave Lady" | "Lyn: Bride of the Plains" | "Lyn: Lady of the Plains" | "Mae: Bundle of Energy" | "Marth: Altean Prince" | "Marth: Enigmatic Blade" | "Mathilda: Legendary Knight" | "Matthew: Faithful Spy" | "Merric: Wind Mage" | "Mia: Lady of Blades" | "Michalis: Ambitious King" | "Minerva: Red Dragoon" | "Mist: Helpful Sister" | "Narcian: Wyvern General" | "Navarre: Scarlet Sword" | "Nephenee: Fierce Halberdier" | "Niles: Cruel to Be Kind" | "Ninian: Oracle of Destiny" | "Nino: Pious Mage" | "Nowi: Eternal Witch" | "Nowi: Eternal Youth" | "Oboro: Fierce Fighter" | "Odin: Potent Force" | "Ogma: Loyal Blade" | "Olivia: Blushing Beauty" | "Olivia: Festival Dancer" | "Olwen: Blue Mage Knight" | "Oscar: Agile Horseman" | "Palla: Eldest Whitewing" | "Priscilla: Delicate Princess" | "Raigh: Dark Child" | "Raven: Peerless Fighter" | "Rebecca: Wildflower" | "Reinhardt: Thunder's Fist" | "Robin: High Deliverer" | "Robin: Mystery Tactician" | "Robin: Seaside Tactician" | "Roderick: Steady Squire" | "Roy: Brave Lion" | "Ryoma: Peerless Samurai" | "Saber: Driven Mercenary" | "Saizo: Angry Ninja" | "Sakura: Gentle Nekomata" | "Sakura: Loving Priestess" | "Sanaki: Begnion's Apostle" | "Selena: Cutting Wit" | "Seliph: Heir of Light" | "Serra: Outspoken Cleric" | "Seth: Silver Knight" | "Setsuna: Absent Archer" | "Shanna: Sprightly Flier" | "Sharena: Princess of Askr" | "Sheena: Princess of Gra" | "Shigure: Dark Sky Singer" | "Sigurd: Holy Knight" | "Sonya: Vengeful Mage" | "Sophia: Nabata Prophet" | "Soren: Shrewd Strategist" | "Stahl: Viridian Knight" | "Subaki: Perfect Expert" | "Sully: Crimson Knight" | "Tailtiu: Thunder Noble" | "Takumi: Wild Card" | "Tana: Winged Princess" | "Tharja: Dark Shadow" | "Tiki: Dragon Scion" | "Tiki: Naga's Voice" | "Tiki: Summering Scion" | "Titania: Mighty Mercenary" | "Tobin: The Clueless One" | "Ursula: Blue Crow" | "Valter: Dark Moonstone" | "Virion: Elite Archer" | "Wrys: Kindly Priest" | "Xander: Paragon Knight" | "Xander: Spring Prince" | "Xander: Student Swimmer" | "Zephiel: The Liberator")[];
        effectiveAgainst?: (import("../interfaces/types").WeaponType | import("../interfaces/types").MovementType)[];
        onCombatStart?(this: import("../components/skill").default, state: import("../systems/state").default, target: import("ape-ecs").Entity): void;
        onEquip?(this: import("../components/skill").default): void;
        onCombatInitiate?(this: import("../components/skill").default, state: import("../systems/state").default, target: import("ape-ecs").Entity): void;
        onCombatAllyStart?(this: import("../components/skill").default, state: import("../systems/state").default, ally: import("ape-ecs").Entity): void;
        onCombatDefense?(this: import("../components/skill").default, state: import("../systems/state").default, attacker: import("ape-ecs").Entity): void;
        onCombatAfter?(this: import("../components/skill").default, state: import("../systems/state").default, target: import("ape-ecs").Entity): void;
        onTurnStart?(this: import("../components/skill").default, state: import("../systems/state").default): void;
        onCombatRoundAttack?(this: import("../components/skill").default, enemy: import("ape-ecs").Entity, combatRound: Partial<import("../interfaces/combat-turn-outcome").default>): void;
        onCombatRoundDefense?(this: import("../components/skill").default, enemy: import("ape-ecs").Entity, combatRound: Partial<import("../interfaces/combat-turn-outcome").default>): void;
        onTurnCheckRange?(this: import("../components/skill").default, state: import("../systems/state").default): void;
        onTurnAllyCheckRange?(this: import("../components/skill").default, state: import("../systems/state").default, ally: import("ape-ecs").Entity): void;
        onTurnEnemyCheckRange?(this: import("../components/skill").default, state: import("../systems/state").default, enemy: import("ape-ecs").Entity): void;
    };
};
export default SKILLS;
//# sourceMappingURL=skill-dex.d.ts.map