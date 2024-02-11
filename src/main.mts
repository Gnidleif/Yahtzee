import * as t from "./testing.mjs";
import {
    GameState,
    Start,
    Game,
    End,
} from "./gamestates.mjs";
const verboseTesting = false;
[
    t.dieTests,
    t.ruleTests,
].forEach((th) => t.RunTests(th, verboseTesting));

const states: GameState[] = [
    new Start(),
    new Game(),
    new End(),
];

states.forEach((state) => {
    state.attach(states[(states.indexOf(state) + 1) % states.length]);
    state.initialize();
});

states[0].update();
states[0].display();