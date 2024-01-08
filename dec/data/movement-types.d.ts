import { MovementType as MoveType } from "../interfaces/types";
interface MovementType {
    range: number;
    bitfield: number;
}
declare const MovementTypes: {
    [k in MoveType]: MovementType;
};
export default MovementTypes;
//# sourceMappingURL=movement-types.d.ts.map