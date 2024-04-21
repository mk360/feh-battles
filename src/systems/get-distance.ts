function getDistance(coord1: { x: number, y: number }, coord2: { x: number, y: number }) {
    return Math.abs(coord1.x - coord2.x) + Math.abs(coord2.y - coord1.y);
}

export default getDistance;