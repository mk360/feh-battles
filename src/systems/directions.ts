class Direction {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    reverse() {
        return new Direction(-this.x, -this.y);
    }

    add(x: number, y: number) {
        return new Direction(this.x + x, this.y + y);
    }

    subtract(x: number, y: number) {
        return new Direction(this.x - x, this.y - y);
    }
};

export default Direction;

