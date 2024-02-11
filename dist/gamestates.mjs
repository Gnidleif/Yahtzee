import { disable, enable, hide, show, } from "./utils.mjs";
import { GameObject, Dice, Player, } from "./game.mjs";
class GameState extends GameObject {
}
export class Start extends GameState {
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
class Game extends GameState {
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
