import * as t from "./testing.mjs";
import * as c from "./composite.mjs";

const verboseTesting = false;
[
    t.dieTests,
    t.ruleTests,
].forEach((th) => t.RunTests(th, verboseTesting));

const playerElement: HTMLElement = document.querySelector("#player-display")!;
const player = new c.Player("Player 1");
player.roll();
playerElement.appendChild(player.display());