import { Component } from "ape-ecs";

export default class Team extends Component { };

Team.properties = {
    team: "" as "team1" | "team2"
};

