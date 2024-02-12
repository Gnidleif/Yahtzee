import { Displayable } from "./display.mjs";
import { disable, enable, hide, show, find, } from "./utils.mjs";
import { Dice, Player, } from "./gameobjects.mjs";
export class StateObserver {
    states;
    currentState = 0;
    constructor(...states) {
        this.states = states;
        this.states.forEach((state) => {
            state.attach(this);
            hide(state.htmlElement);
        });
    }
    get current() {
        return this.states[this.currentState];
    }
    start(...args) {
        this.current.initialize(...args);
        show(this.current.htmlElement);
        this.current.display();
    }
    next(...args) {
        hide(this.current.htmlElement);
        this.currentState = (this.currentState + 1) % this.states.length;
        this.start(...args);
    }
}
export class GameState extends Displayable {
    constructor(element) {
        super(element);
    }
}
export class Start extends GameState {
    addButton;
    startButton;
    playerList;
    playerNames = [];
    constructor() {
        super(document.querySelector("#start-state"));
        this.addButton = find(this.element, "#add-button");
        this.startButton = find(this.element, "#start-game");
        this.playerList = find(this.element, "#player-list");
    }
    initialize() {
        this.playerNames = [];
        this.playerList.innerHTML = "";
        disable(this.addButton);
        disable(this.startButton);
    }
    attach(observer) {
        this.element.querySelector("#player-name").addEventListener("input", (evt) => {
            const target = evt.target;
            if (target.value.length >= 3) {
                enable(this.addButton);
            }
            else {
                disable(this.addButton);
            }
        });
        this.addButton.addEventListener("click", () => {
            const input = this.element.querySelector("#player-name");
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
            observer.next(...this.playerNames);
        });
    }
    display() {
        const listItems = this.playerNames.map(name => {
            const li = document.createElement("li");
            li.textContent = name;
            return li;
        });
        this.playerList.replaceChildren(...listItems);
    }
}
export class Game extends GameState {
    dice;
    maxRolls = 3;
    rolls = 3;
    players = [];
    currentIndex = 0;
    rollButton;
    nextButton;
    endButton;
    scoreCardTable;
    clickedRule = null;
    constructor() {
        super(document.querySelector("#game-state"));
        this.scoreCardTable = find(this.element, "#score-card");
        this.dice = new Dice(find(this.element, ".dice"));
        this.rollButton = find(this.element, "#roll");
        this.nextButton = find(this.element, "#next");
        this.endButton = find(this.element, "#end");
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
    onRuleClick(ruleName) {
        if ((this.clickedRule && this.clickedRule !== ruleName)
            || (!this.clickedRule && this.currentPlayer.scoreState.isFrozen(ruleName))) {
            return;
        }
        this.currentPlayer.scoreState.toggle(ruleName);
        this.clickedRule = this.currentPlayer.scoreState.isFrozen(ruleName)
            ? ruleName
            : null;
        this.clickedRule ? enable(this.nextButton) : disable(this.nextButton);
        this.clickedRule ? disable(this.rollButton) : enable(this.rollButton);
    }
    onNextClick() {
        this.currentIndex = this.nextIndex;
        this.rolls = this.maxRolls;
        this.clickedRule = null;
        this.dice.unfreezeAll();
        this.update();
        this.display();
        disable(this.nextButton);
    }
    update() {
        this.dice.update();
        this.currentPlayer.update(...this.dice.values);
        this.rolls--;
    }
    initialize(...playerNames) {
        this.clickedRule = null;
        this.currentIndex = 0;
        this.rolls = 3;
        this.players = playerNames.map(name => new Player(this.htmlElement, this.scoreCardTable, name, this.dice.values.length));
        disable(this.nextButton);
        this.update();
    }
    attach(observer) {
        this.rollButton.addEventListener("click", () => {
            if (this.rolls > 0) {
                this.update();
                this.display();
            }
        });
        this.nextButton.addEventListener("click", () => {
            if (this.isDone) {
                observer.next(...this.players);
                return;
            }
            this.onNextClick();
        });
        this.endButton.addEventListener("click", () => {
            observer.next(...this.players);
        });
        this.scoreCardTable.addEventListener("click", (evt) => {
            const target = evt.target.parentNode;
            if (target.classList.contains("rule")) {
                this.onRuleClick(target.id);
            }
        });
    }
    display() {
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
export class End extends GameState {
    players = [];
    winnerList;
    constructor() {
        super(document.querySelector("#end-state"));
        this.winnerList = find(this.element, "#winner");
    }
    initialize(...players) {
        this.players = players.sort((a, b) => b.scoreState.score - a.scoreState.score);
        this.winnerList.innerHTML = "";
    }
    attach(observer) {
        find(this.element, "#restart").addEventListener("click", () => {
            observer.next();
        });
    }
    display() {
        const listItems = this.players.map(player => {
            const li = document.createElement("li");
            li.textContent = `${player.playerName} - ${player.scoreState.score}`;
            return li;
        });
        this.winnerList.replaceChildren(...listItems);
    }
}
