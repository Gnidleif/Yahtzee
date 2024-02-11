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
} from "./gameobjects.mjs";

export abstract class GameState extends GameObject {
    protected nextState: GameState | null = null;
    constructor(element: HTMLElement) {
        super(element);
    }

    switchState(): void {
        hide(this.htmlElement);
        this.nextState!.update();
        this.nextState!.display();
    }

    abstract initialize(): void;
    abstract attach(nextState: GameState): void;
}

export class Start extends GameState {
    declare protected nextState: Game;

    private readonly addSection: HTMLElement;
    private readonly addButton: HTMLButtonElement;
    private readonly startButton: HTMLButtonElement;
    private readonly playerList: HTMLOListElement;
    private playerNames: string[] = [];

    constructor() {
        super(document.querySelector("#start-state")!);
        this.addSection = this.find("#add-player");
        this.addButton = this.find("#add-button") as HTMLButtonElement;
        this.startButton = this.find("#start-game") as HTMLButtonElement;
        this.playerList = this.find("#player-list") as HTMLOListElement;
    }

    override initialize(): void {
        this.playerNames = [];
        this.playerList.innerHTML = "";
        disable(this.addButton);
        disable(this.startButton);
    }

    override attach(nextState: Game): void {
        this.nextState = nextState;
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
            this.nextState.initialize(...this.playerNames);
            this.switchState();
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
    declare protected nextState: End;

    private clickedRule: string | null = "";

    private readonly dice: Dice;
    private readonly maxRolls: number = 3;
    private rolls: number = 3;

    private players: Player[] = [];
    private currentIndex: number = 0;

    private readonly rollButton: HTMLButtonElement;
    private readonly nextButton: HTMLButtonElement;
    private readonly scoreCardTable: HTMLTableElement;

    constructor() {
        super(document.querySelector("#game-state")!)
        this.scoreCardTable = this.find("#score-card") as HTMLTableElement;
        this.dice = new Dice(this.find(".dice"));

        this.rollButton = this.find("#roll") as HTMLButtonElement;
        this.nextButton = this.find("#next") as HTMLButtonElement;
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

    nextClicked(): void {
        this.currentIndex = this.nextIndex;
        this.rolls = this.maxRolls;
        this.clickedRule = null;
        this.dice.unfreezeAll();
        this.update();
        this.display();
        disable(this.nextButton);
    }

    override initialize(...playerNames: string[]): void {
        this.clickedRule = null;
        this.currentIndex = 0;
        this.rolls = 3;
        this.players = playerNames.map(name => new Player(this.htmlElement, this.scoreCardTable, name));
        disable(this.nextButton);
    }

    override attach(nextState: End): void {
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
    declare protected nextState: Start;

    private players: Player[] = [];
    private readonly winnerList: HTMLOListElement;

    constructor() {
        super(document.querySelector("#end-state")!);
        this.winnerList = this.find("#winner") as HTMLOListElement;
    }

    override initialize(...players: Player[]): void {
        this.players = players.sort((a, b) => b.scoreState.score - a.scoreState.score);
        this.winnerList.innerHTML = "";
    }

    override attach(nextState: Start): void {
        this.nextState = nextState;
        this.find("#restart").addEventListener("click", () => {
            this.nextState.initialize();
            this.switchState();
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
        this.winnerList.replaceChildren(...listItems);
    }
}