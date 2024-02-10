import * as t from "./testing.mjs";
import {
    Start,
    Game,
    End,
} from "./game.mjs";

const verboseTesting = false;
[
    t.dieTests,
    t.ruleTests,
].forEach((th) => t.RunTests(th, verboseTesting));

const startState: HTMLElement = document.querySelector("#start-state")!;
const gameState: HTMLElement = document.querySelector("#game-state")!;
const endState: HTMLElement = document.querySelector("#end-state")!;

const start = new Start(startState);
start.show();

const game = new Game(gameState, ["Player 1", "Player 2"]);
game.update();
game.display();
game.show();

const end = new End(endState);
end.show();