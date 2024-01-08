import { Component } from "ape-ecs"

export default class DamageIncrease extends Component {
    static properties = {
        amount: 0,
        percentage: 0
    };
};
