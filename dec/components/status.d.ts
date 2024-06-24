import { Component, EntityRef } from "ape-ecs";
declare class Status extends Component {
    static properties: {
        value: string;
        source: typeof EntityRef;
    };
}
export default Status;
//# sourceMappingURL=status.d.ts.map