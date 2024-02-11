import * as t from "./testing.mjs";
import {
    Start,
} from "./game.mjs";
const verboseTesting = false;
[
    t.dieTests,
    t.ruleTests,
].forEach((th) => t.RunTests(th, verboseTesting));

const startState: HTMLElement = document.querySelector("#start-state")!;
let start = new Start(startState);
start.update();
start.display();

document.querySelector("#restart")!.addEventListener("click", () => {
    start = new Start(startState);
    start.display();
});