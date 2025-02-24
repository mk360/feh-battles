import { Component } from "ape-ecs";

/**
 * Neutralize an opponent's Map Buffs in all of the stats, or in specified stats.
 */
class NeutralizeMapBuffs extends Component {
    static properties = {
        stats: []
    }
};

export default NeutralizeMapBuffs;
