import {
    disable,
    enable,
    hide,
    show,
} from "./utils.mjs";
import {
    GameObject,
    Dice,
    Player,
} from "./game.mjs";

export abstract class GameState extends GameObject {
    abstract attachListeners(): void;
}

export class Start extends GameState {
    private readonly addSection: HTMLElement;
    private readonly addButton: HTMLButtonElement;
    private readonly startButton: HTMLButtonElement;
    private readonly playerList: HTMLOListElement;
    private readonly playerNames: string[] = [];

    constructor(element: HTMLElement) {
        super(element);
        this.addSection = this.find("#add-player");
        this.addButton = this.find("#add-button") as HTMLButtonElement;
        this.startButton = this.find("#start-game") as HTMLButtonElement;
        this.playerList = this.find("#player-list") as HTMLOListElement;
        
        disable(this.addButton);
        disable(this.startButton);
    }

    override attachListeners(): void {
        this.addSection.querySelector("#player-name")!.addEventListener("input", (evt: Event) => {
            const target = evt.target! as HTMLInputElement;
            if (target.value.length >= 3) {
                enable(this.addButton);
            }
            else {
                disable(this.addButton);
            }
        });

        this.addButton.addEventListener("click", () => {
            const input = this.addSection.querySelector("#player-name") as HTMLInputElement;
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
            const game = new Game(document.querySelector("#game-state")!, this.playerNames);
            game.update();
            game.display();
        });
    }

    update(): void {
    }

    display(): void {
        show(this.htmlElement);
        const listItems: HTMLLIElement[] = this.playerNames.map(name => {
            const li = document.createElement("li");
            li.textContent = name;
            return li;
        });
        this.playerList.replaceChildren(...listItems);
    }
}

export class Game extends GameState {
    private clickedRule: string | null = "";

    private readonly dice: Dice;
    private readonly maxRolls: number = 3;
    private rolls: number = 3;

    private readonly players: Player[];
    private currentIndex: number = 0;

    private readonly rollButton: HTMLButtonElement;
    private readonly nextButton: HTMLButtonElement;
    private readonly scoreCardTable: HTMLTableElement;

    constructor(element: HTMLElement, playerNames: string[]) {
        super(element);
        this.scoreCardTable = this.find("#score-card") as HTMLTableElement;
        this.players = playerNames.map(name => new Player(element, this.scoreCardTable, name));
        this.dice = new Dice(this.find(".dice"));

        this.rollButton = this.find("#roll") as HTMLButtonElement;
        this.nextButton = this.find("#next") as HTMLButtonElement;

        disable(this.nextButton);
    }

    get isDone(): boolean {
        return this.players.every(player => player.scoreState.isDone);
    }
    
    get currentPlayer(): Player {
        return this.players[this.currentIndex];
    }

    get nextIndex(): number {
        return (this.currentIndex + 1) % this.players.length;
    }

    ruleClicked(ruleName: string): void {
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

    nextClicked(): void {
        if (this.isDone) {
            hide(this.htmlElement);
            const end = new End(document.querySelector("#end-state")!, this.players);
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

    override attachListeners(): void {
        this.rollButton.addEventListener("click", () => {
            if (this.rolls > 0) {
                this.update();
                this.display();
            }
        });

        this.nextButton.addEventListener("click", () => {
            this.nextClicked();
        });

        this.scoreCardTable.addEventListener("click", (evt: Event) => {
            const target = (evt.target! as HTMLElement).parentNode as HTMLElement;
            if (target.classList.contains("rule")) {
                this.ruleClicked(target.id);
            }
        });
    }

    override update(): void {
        this.dice.update();
        this.currentPlayer.update(...this.dice.values);
        this.rolls--;
    }

    override display(): void {
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
    private players: Player[];
    private readonly scoreList: HTMLOListElement;

    constructor(element: HTMLElement, players: Player[]) {
        super(element);
        this.players = players.sort((a, b) => b.scoreState.score - a.scoreState.score);
        this.scoreList = this.find("#winner") as HTMLOListElement;
    }

    override attachListeners(): void {
        this.find("#restart").addEventListener("click", () => {
            hide(this.htmlElement);
        });
    }

    override update(): void {
        
    }

    override display(): void {
        show(this.htmlElement);
        const listItems: HTMLLIElement[] = this.players.map(player => {
            const li = document.createElement("li");
            li.textContent = `${player.playerName} - ${player.scoreState.score}`;
            return li;
        });
        this.scoreList.replaceChildren(...listItems);
    }
}