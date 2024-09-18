import ASSISTS from "./assists";
import PASSIVES from "./passives";
import SPECIALS from "./specials";
import WEAPONS from "./weapons";

const SKILLS = {
    ...WEAPONS,
    ...ASSISTS,
    ...SPECIALS,
    ...PASSIVES
};

export default SKILLS;
