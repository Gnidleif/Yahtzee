import { hide, show, disable, enable, find, } from './utils.mjs';
import { Die, Rule, } from './composite.mjs';
import { DieLogic, NumberOfLogic, BonusLogic, } from './logic.mjs';
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
        // new Rule(new NumberOfLogic(2)),
        // new Rule(new NumberOfLogic(3)),
        // new Rule(new NumberOfLogic(4)),
        // new Rule(new NumberOfLogic(5)),
        // new Rule(new NumberOfLogic(6)),
        // new Rule(new OfAKindLogic(3)),
        // new Rule(new OfAKindLogic(4)),
        // new Rule(new StraightLogic(4)),
        // new Rule(new StraightLogic(5)),
        // new Rule(new FullHouseLogic()),
        // new Rule(new ChanceLogic()),
        // new Rule(new YahtzeeLogic()),
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
    get isDone() {
        return this.rules.every(rule => rule.isFrozen);
    }
    isFrozen(ruleName) {
        return this.rules.find(rule => rule.ruleName === ruleName).isFrozen;
    }
    toggle(ruleName) {
        this.rules.find(rule => rule.ruleName === ruleName).toggle();
    }
    freeze(ruleName) {
        this.rules.find(rule => rule.ruleName === ruleName).freeze();
    }
    unfreeze() {
        this.rules.forEach(rule => rule.unfreeze());
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
    scoreCard;
    constructor(element, scoreCardTable, name) {
        super(element);
        this.name = name;
        this.scoreCard = new ScoreCard(scoreCardTable);
    }
    get playerName() {
        return this.name;
    }
    get scoreState() {
        return this.scoreCard;
    }
    update(...diceValues) {
        this.scoreCard.update(...diceValues);
    }
    display() {
        this.find("#player-name").textContent = this.name;
        this.find("#player-score").textContent = `Score: ${this.scoreCard.score}`;
        this.scoreCard.display();
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
        const listItems = this.playerNames.map(name => {
            const li = document.createElement("li");
            li.textContent = name;
            return li;
        });
        this.playerList.replaceChildren(...listItems);
    }
}
class Game extends GameObject {
    clickedRule = "";
    dice;
    maxRolls = 3;
    rolls = 3;
    players;
    currentIndex = 0;
    rollButton;
    nextButton;
    scoreCardTable;
    constructor(element, playerNames) {
        super(element);
        this.scoreCardTable = this.find("#score-card");
        this.players = playerNames.map(name => new Player(element, this.scoreCardTable, name));
        this.dice = new Dice(this.find(".dice"));
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
            this.nextClicked();
        });
        this.scoreCardTable.addEventListener("click", (evt) => {
            const target = evt.target.parentNode;
            if (target.classList.contains("rule")) {
                this.ruleClicked(target.id);
            }
        });
    }
    get isDone() {
        return this.players.every(player => player.scoreState.isDone);
    }
    get currentPlayer() {
        return this.players[this.currentIndex];
    }
    get nextIndex() {
        return (this.currentIndex + 1) % this.players.length;
    }
    ruleClicked(ruleName) {
        if (this.clickedRule && this.clickedRule !== ruleName) {
            return;
        }
        this.currentPlayer.scoreState.toggle(ruleName);
        this.clickedRule = this.currentPlayer.scoreState.isFrozen(ruleName)
            ? ruleName
            : null;
        this.clickedRule ? enable(this.nextButton) : disable(this.nextButton);
        this.clickedRule ? disable(this.rollButton) : enable(this.rollButton);
    }
    nextClicked() {
        if (this.isDone) {
            hide(this.htmlElement);
            const end = new End(document.querySelector("#end-state"), this.players);
            end.update();
            end.display();
            return;
        }
        this.currentIndex = this.nextIndex;
        this.rolls = this.maxRolls;
        this.clickedRule = null;
        this.dice.unfreeze();
        this.update();
        this.display();
        disable(this.nextButton);
    }
    update() {
        this.dice.update();
        this.currentPlayer.update(...this.dice.values);
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
    }
}
class End extends GameObject {
    players;
    constructor(element, players) {
        super(element);
        this.players = players;
        this.find("#restart").addEventListener("click", () => {
            hide(this.htmlElement);
        });
    }
    update() {
        this.players = this.players.sort((a, b) => b.scoreState.score - a.scoreState.score);
    }
    display() {
        show(this.htmlElement);
        const scoreList = this.find("#winner");
        scoreList.innerHTML = "";
        const listItems = this.players.map(player => {
            const li = document.createElement("li");
            li.textContent = `${player.playerName} - ${player.scoreState.score}`;
            return li;
        });
        scoreList.replaceChildren(...listItems);
    }
}
