import * as c from "./composite.mjs";
// const verboseTesting = false;
// [
//     t.dieTests,
//     t.ruleTests,
//     t.ruleSheetTests,
// ].forEach((th) => t.RunTests(th, verboseTesting));
const personElement = document.querySelector("#player-display");
const person = new c.Player("Player 1");
person.rollDice();
personElement.appendChild(person.display());
const rollButton = document.querySelector("#roll");
rollButton.addEventListener("click", () => {
    person.rollDice();
    personElement.appendChild(person.display());
});
