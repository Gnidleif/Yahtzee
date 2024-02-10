import { Die, Rule, } from './composite.mjs';
import { DieLogic, NumberOfLogic, OfAKindLogic, StraightLogic, FullHouseLogic, ChanceLogic, YahtzeeLogic, } from './logic.mjs';
class GameObject {
    htmlElement;
    constructor(element) {
        this.htmlElement = element;
        this.hide();
    }
    hide() {
        this.htmlElement.style.display = "none";
    }
    show(displayType = "block") {
        this.htmlElement.style.display = displayType;
    }
}
class ScoreCard extends GameObject {
    rules = [
        new Rule(new NumberOfLogic(1)),
        new Rule(new NumberOfLogic(2)),
        new Rule(new NumberOfLogic(3)),
        new Rule(new NumberOfLogic(4)),
        new Rule(new NumberOfLogic(5)),
        new Rule(new NumberOfLogic(6)),
        new Rule(new OfAKindLogic(3)),
        new Rule(new OfAKindLogic(4)),
        new Rule(new StraightLogic(4)),
        new Rule(new StraightLogic(5)),
        new Rule(new FullHouseLogic()),
        new Rule(new ChanceLogic()),
        new Rule(new YahtzeeLogic()),
    ];
    constructor(element) {
        const table = document.createElement("table");
        element.appendChild(table);
        super(table);
        const header = document.createElement("tr");
        const nameCell = document.createElement("td");
        nameCell.textContent = "Name";
        header.appendChild(nameCell);
        const scoreCell = document.createElement("td");
        scoreCell.textContent = "Score";
        header.appendChild(scoreCell);
        this.htmlElement.appendChild(header);
    }
    get score() {
        return this.rules
            .filter(rule => rule.isFrozen)
            .reduce((acc, cur) => acc + cur.score, 0);
    }
    update(...diceValues) {
        this.rules.forEach(rule => rule.update(...diceValues));
    }
    display() {
        this.show();
        this.htmlElement.querySelectorAll(".rule").forEach(rule => rule.remove());
        this.htmlElement.append(...this.rules.map(rule => rule.display()));
    }
}
class Dice extends GameObject {
    dice;
    constructor(element, dieCount = 5, sides = 6) {
        super(element);
        this.dice = Array.from({ length: dieCount }, () => new Die(new DieLogic(sides)));
    }
    get values() {
        return this.dice.map(die => die.currentValue);
    }
    update() {
        this.dice.forEach(die => die.roll());
    }
    display() {
        this.show("flex");
        this.htmlElement.replaceChildren(...this.dice.map(die => die.display()));
    }
}
class Player extends GameObject {
    name;
    score = 0;
    scoreCard;
    constructor(element, name) {
        super(element);
        this.name = name;
        this.scoreCard = new ScoreCard(element.querySelector("#score-card"));
    }
    update(...diceValues) {
        this.scoreCard.update(...diceValues);
        this.score = this.scoreCard.score;
    }
    display() {
        this.htmlElement.querySelector("#player-name")
            .textContent = this.name;
        this.htmlElement.querySelector("#player-score")
            .textContent = `Score: ${this.score}`;
        this.scoreCard.show();
        this.scoreCard.display();
    }
}
export class Start extends GameObject {
    update() {
        throw new Error('Method not implemented.');
    }
    display() {
        this.show();
    }
}
export class Game extends GameObject {
    players;
    dice;
    currentIndex = 0;
    constructor(element, playerNames) {
        super(element);
        this.players = playerNames
            .map(name => new Player(element, name));
        this.dice = new Dice(element.querySelector(".dice"));
    }
    get currentPlayer() {
        return this.players[this.currentIndex];
    }
    update() {
        this.dice.update();
        this.currentPlayer.update(...this.dice.values);
    }
    display() {
        this.dice.display();
        this.currentPlayer.display();
    }
}
export class End extends GameObject {
    update() {
        throw new Error('Method not implemented.');
    }
    display() {
        throw new Error('Method not implemented.');
    }
}
