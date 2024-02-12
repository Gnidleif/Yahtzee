import * as t from "./testing.mjs";
const verbose = false;
[t.ruleTests, t.dieTests,].forEach(th => t.RunTests(th, verbose));

import {StateObserver, Start, Game, End, } from "./gamestates.mjs";
const observer = new StateObserver(new Start(), new Game(), new End());
observer.start();