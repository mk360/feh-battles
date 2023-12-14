type TileType = "void" | "ground" | "forest" | "wall";

const TileTypes = {
    void: 0b1,
    ground: 0b1111,
    forest: 0b0111,
    wall: 0b0000
} as const;

export default TileTypes;

