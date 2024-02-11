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
    toggle(id) {
        this.rules.find(rule => rule.ruleName === id).toggle();
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
    unfreeze() {
        this.dice.forEach(die => die.unfreeze());
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
    constructor(element, name) {
        super(element);
        this.name = name;
    }
    get playerName() {
        return this.name;
    }
    update(ruleScore = 0) {
        this.score = ruleScore;
    }
    display() {
        this.find("#player-name").textContent = this.name;
        this.find("#player-score").textContent = `Score: ${this.score}`;
    }
}
export class Start extends GameObject {
    addSection;
    addButton;
    startButton;
    playerList;
    playerNames = [];
    constructor(element) {
        super(element);
        this.addSection = this.find("#add-player");
        this.addButton = this.find("#add-button");
        this.startButton = this.find("#start-game");
        this.playerList = this.find("#player-list");
        disable(this.addButton);
        disable(this.startButton);
    }
    update() {
        this.addSection.querySelector("#player-name").addEventListener("input", (evt) => {
            const target = evt.target;
            if (target.value.length >= 3) {
                enable(this.addButton);
            }
            else {
                disable(this.addButton);
            }
        });
        this.addButton.addEventListener("click", () => {
            const input = this.addSection.querySelector("#player-name");
            const name = input.value;
            input.value = "";
            this.playerNames.push(name);
            if (this.playerNames.length >= 2) {
                enable(this.startButton);
            }
            disable(this.addButton);
            this.display();
        });
        this.startButton.addEventListener("click", () => {
            hide(this.htmlElement);
            const game = new Game(document.querySelector("#game-state"), this.playerNames);
            game.update();
            game.display();
        });
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
    scoreCard;
    clickedRule = "";
    dice;
    maxRolls = 3;
    rolls = 3;
    players;
    currentIndex = 0;
    rollButton;
    nextButton;
    constructor(element, playerNames) {
        super(element);
        this.players = playerNames.map(name => new Player(element, name));
        this.dice = new Dice(this.find(".dice"));
        const scoreCardElement = this.find("#score-card");
        this.scoreCard = new ScoreCard(scoreCardElement);
        this.rollButton = this.find("#roll");
        this.nextButton = this.find("#next");
        disable(this.nextButton);
        this.rollButton.addEventListener("click", () => {
            if (this.rolls > 0) {
                this.update();
                this.display();
            }
        });
        this.nextButton.addEventListener("click", () => {
            this.currentIndex = this.nextIndex;
            this.rolls = this.maxRolls;
            this.clickedRule = null;
            this.dice.unfreeze();
            this.update();
            this.display();
        });
        scoreCardElement.addEventListener("click", (evt) => {
            const target = evt.target.parentNode;
            if (!target.classList.contains("rule")) {
                return;
            }
            if (!this.clickedRule || this.clickedRule === target.id) {
                this.clickedRule = !this.clickedRule
                    ? target.id
                    : null;
                this.scoreCard.toggle(target.id);
            }
            this.clickedRule ? enable(this.nextButton) : disable(this.nextButton);
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
        this.scoreCard.update(...this.dice.values);
        this.currentPlayer.update(this.scoreCard.score);
        this.rolls--;
    }
    display() {
        show(this.htmlElement);
        if (this.rolls === 0) {
            disable(this.rollButton);
        }
        else {
            enable(this.rollButton);
        }
        this.rollButton.textContent = `Roll: ${this.rolls}`;
        this.nextButton.textContent = `Next: ${this.players[this.nextIndex].playerName}`;
        this.currentPlayer.display();
        this.dice.display();
        this.scoreCard.display();
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
