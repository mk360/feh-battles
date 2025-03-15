import { parentPort } from "worker_threads";
import GameWorld from "./world";

parentPort?.postMessage(GameWorld);