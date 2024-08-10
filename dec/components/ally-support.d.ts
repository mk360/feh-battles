import { Component, EntityRef } from "ape-ecs";
declare class AllySupport extends Component {
    static properties: {
        ally: typeof EntityRef;
        level: string;
    };
}
export default AllySupport;
//# sourceMappingURL=ally-support.d.ts.map