import { disable, enable, hide, show, } from "./utils.mjs";
import { GameObject, Dice, Player, } from "./game.mjs";
export class GameState extends GameObject {
    nextState = null;
    constructor(element) {
        super(element);
    }
    switchState() {
        hide(this.htmlElement);
        this.nextState.update();
        this.nextState.display();
    }
}
export class Start extends GameState {
    addSection;
    addButton;
    startButton;
    playerList;
    playerNames = [];
    constructor() {
        super(document.querySelector("#start-state"));
        this.addSection = this.find("#add-player");
        this.addButton = this.find("#add-button");
        this.startButton = this.find("#start-game");
        this.playerList = this.find("#player-list");
    }
    initialize() {
        this.playerNames = [];
        this.playerList.innerHTML = "";
        disable(this.addButton);
        disable(this.startButton);
    }
    attach(nextState) {
        this.nextState = nextState;
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
            this.nextState.initialize(...this.playerNames);
            this.switchState();
        });
    }
    update() {
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
export class Game extends GameState {
    clickedRule = "";
    dice;
    maxRolls = 3;
    rolls = 3;
    players = [];
    currentIndex = 0;
    rollButton;
    nextButton;
    scoreCardTable;
    constructor() {
        super(document.querySelector("#game-state"));
        this.scoreCardTable = this.find("#score-card");
        this.dice = new Dice(this.find(".dice"));
        this.rollButton = this.find("#roll");
        this.nextButton = this.find("#next");
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
        if (!this.clickedRule && this.currentPlayer.scoreState.isFrozen(ruleName)) {
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
        this.currentIndex = this.nextIndex;
        this.rolls = this.maxRolls;
        this.clickedRule = null;
        this.dice.unfreeze();
        this.update();
        this.display();
        disable(this.nextButton);
    }
    initialize(...playerNames) {
        this.clickedRule = null;
        this.currentIndex = 0;
        this.rolls = 3;
        this.players = playerNames.map(name => new Player(this.htmlElement, this.scoreCardTable, name));
        disable(this.nextButton);
    }
    attach(nextState) {
        this.nextState = nextState;
        this.rollButton.addEventListener("click", () => {
            if (this.rolls > 0) {
                this.update();
                this.display();
            }
        });
        this.nextButton.addEventListener("click", () => {
            if (this.isDone) {
                this.nextState.initialize(...this.players);
                this.switchState();
                return;
            }
            this.nextClicked();
        });
        this.scoreCardTable.addEventListener("click", (evt) => {
            const target = evt.target.parentNode;
            if (target.classList.contains("rule")) {
                this.ruleClicked(target.id);
            }
        });
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
export class End extends GameState {
    players = [];
    winnerList;
    constructor() {
        super(document.querySelector("#end-state"));
        this.winnerList = this.find("#winner");
    }
    initialize(...players) {
        this.players = players.sort((a, b) => b.scoreState.score - a.scoreState.score);
        this.winnerList.innerHTML = "";
    }
    attach(nextState) {
        this.nextState = nextState;
        this.find("#restart").addEventListener("click", () => {
            this.nextState.initialize();
            this.switchState();
        });
    }
    update() {
    }
    display() {
        show(this.htmlElement);
        const listItems = this.players.map(player => {
            const li = document.createElement("li");
            li.textContent = `${player.playerName} - ${player.scoreState.score}`;
            return li;
        });
        this.winnerList.replaceChildren(...listItems);
    }
}
