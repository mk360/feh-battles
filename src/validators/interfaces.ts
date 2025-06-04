import { Stat } from "../interfaces/types";

export interface ValidationHero {
    name: string;
    skills: {
        weapon: string;
        assist: string;
        special: string;
        A: string;
        B: string;
        C: string;
        S: string;
    }
    merges: number;
    asset: Stat | "";
    flaw: Stat | "";
}