import { hide, show, disable, enable, find, } from './utils.mjs';
import { Die, Rule, } from './composite.mjs';
import { DieLogic, NumberOfLogic, OfAKindLogic, StraightLogic, FullHouseLogic, ChanceLogic, YahtzeeLogic, BonusLogic, } from './logic.mjs';
class GameObject {
    htmlElement;
    constructor(element) {
        this.htmlElement = element;
        hide(this.htmlElement);
    }
    find(selector) {
        return find(this.htmlElement, selector);
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
    bonusAdded = false;
    bonus;
    constructor(element) {
        super(element);
        this.bonus = new Rule(new BonusLogic(63));
    }
    get score() {
        return this.rules
            .filter(rule => rule.isFrozen)
            .reduce((acc, cur) => acc + cur.score, 0);
    }
    checkBonus() {
        const numberOfScores = this.rules
            .filter(rule => rule.isFrozen)
            .filter(rule => rule.checkType(NumberOfLogic))
            .map(rule => rule.score);
        if (numberOfScores.length === 0) {
            return;
        }
        this.bonus.update(...numberOfScores);
        if (this.bonus.score > 0 || numberOfScores.length === 6) {
            this.bonus.toggle();
            this.rules.splice(6, 0, this.bonus);
            this.bonusAdded = true;
        }
    }
    update(...diceValues) {
        this.rules.forEach(rule => rule.update(...diceValues));
        if (!this.bonusAdded) {
            this.checkBonus();
        }
    }
    display() {
        show(this.htmlElement);
        this.htmlElement.replaceChildren(...this.rules.map(rule => rule.display()));
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
        show(this.htmlElement, "flex");
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
        this.scoreCard = new ScoreCard(this.find("#score-card"));
    }
    get playerName() {
        return this.name;
    }
    update(...diceValues) {
        this.scoreCard.update(...diceValues);
        this.score = this.scoreCard.score;
    }
    display() {
        this.find("#player-name").textContent = this.name;
        this.find("#player-score").textContent = `Score: ${this.score}`;
        this.scoreCard.display();
    }
}
export class Start {
    htmlElement;
    addForm;
    addButton;
    startButton;
    playerList;
    playerNames = [];
    constructor(element) {
        this.htmlElement = element;
        this.addForm = find(this.htmlElement, "#add-player");
        this.addButton = find(this.htmlElement, "#add-button");
        this.startButton = find(this.htmlElement, "#start-game");
        this.playerList = find(this.htmlElement, "#player-list");
        this.addForm.querySelector("#player-name").addEventListener("input", (evt) => {
            const target = evt.target;
            if (target.value.length >= 3) {
                enable(this.addButton);
            }
        });
        this.addButton.addEventListener("click", () => {
            const input = this.addForm.querySelector("#player-name");
            const name = input.value;
            input.value = "";
            this.playerNames.push(name);
            if (this.playerNames.length >= 2) {
                enable(this.startButton);
            }
            this.display();
        });
        disable(this.addButton);
        disable(this.startButton);
    }
    display() {
        show(this.htmlElement);
        this.playerList.replaceChildren(...this.playerNames.map(name => {
            const li = document.createElement("li");
            li.textContent = name;
            return li;
        }));
    }
}
export class Game extends GameObject {
    players;
    currentIndex = 0;
    dice;
    maxRolls = 3;
    rolls = 3;
    rollButton;
    nextButton;
    constructor(element, playerNames) {
        super(element);
        this.players = playerNames
            .map(name => new Player(element, name));
        this.dice = new Dice(element.querySelector(".dice"));
        this.rollButton = this.htmlElement.querySelector("#roll");
        this.rollButton.addEventListener("click", () => {
            if (this.rolls > 0) {
                this.rolls--;
                this.update();
                this.display();
            }
        });
        this.nextButton = this.htmlElement.querySelector("#next");
        this.nextButton.addEventListener("click", () => {
            this.currentIndex = this.nextIndex;
            this.rolls = this.maxRolls;
            this.update();
            this.display();
        });
    }
    get currentPlayer() {
        return this.players[this.currentIndex];
    }
    get nextIndex() {
        return (this.currentIndex + 1) % this.players.length;
    }
    update() {
        this.dice.update();
        this.currentPlayer.update(...this.dice.values);
    }
    display() {
        this.rollButton.textContent = `Roll: ${this.rolls}`;
        this.nextButton.textContent = `Next: ${this.players[this.nextIndex].playerName}`;
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
