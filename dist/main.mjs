import * as t from "./testing.mjs";
import { Start, } from "./game.mjs";
const verboseTesting = false;
[
    t.dieTests,
    t.ruleTests,
].forEach((th) => t.RunTests(th, verboseTesting));
const startState = document.querySelector("#start-state");
const gameState = document.querySelector("#game-state");
const endState = document.querySelector("#end-state");
const start = new Start(startState);
start.display();
