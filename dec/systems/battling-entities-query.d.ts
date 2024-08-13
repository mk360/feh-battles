import { System } from "ape-ecs";
declare function battlingEntitiesQuery(system: System): () => {
    attacker: import("ape-ecs").Entity;
    defender: import("ape-ecs").Entity;
};
export default battlingEntitiesQuery;
//# sourceMappingURL=battling-entities-query.d.ts.map