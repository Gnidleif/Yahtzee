import { 
    Displayable
} from "./display.mjs";
import {
    disable,
    enable,
    hide,
    show,
    find,
} from "./utils.mjs";
import {
    Dice,
    Player,
} from "./gameobjects.mjs";

export class StateObserver {
    private readonly states: GameState[];
    private currentState: number = 0;

    constructor(...states: GameState[]) {
        this.states = states;
        this.states.forEach((state) => {
            state.attach(this);
            hide(state.htmlElement);
        });
    }

    private get current(): GameState {
        return this.states[this.currentState];
    }

    start(...args: any[]): void {
        this.current.initialize(...args);
        show(this.current.htmlElement);
        this.current.display();
    }

    next(...args: any[]): void {
        hide(this.current.htmlElement);
        this.currentState = (this.currentState + 1) % this.states.length;
        this.start(...args);
    }
}

export abstract class GameState extends Displayable {
    constructor(element: HTMLElement) {
        super(element)
    }

    abstract attach(observer: StateObserver): void;
    abstract initialize(...args: any[]): void;
    abstract display(): void;
}

export class Start extends GameState {
    private readonly addButton: HTMLButtonElement;
    private readonly startButton: HTMLButtonElement;
    private readonly playerList: HTMLOListElement;
    private playerNames: string[] = [];

    constructor() {
        super(document.querySelector("#start-state")!);
        this.addButton = this.find("#add") as HTMLButtonElement;
        this.startButton = this.find("#start-game") as HTMLButtonElement;
        this.playerList = this.find("#player-list") as HTMLOListElement;
    }

    override initialize(): void {
        this.playerNames = [];
        this.playerList.innerHTML = "";
        disable(this.addButton);
        disable(this.startButton);
    }

    override attach(observer: StateObserver): void {
        this.element.querySelector("#player-name")!.addEventListener("input", (evt: Event) => {
            const target = evt.target! as HTMLInputElement;
            if (target.value.length >= 3) {
                enable(this.addButton);
            }
            else {
                disable(this.addButton);
            }
        });

        this.addButton.addEventListener("click", () => {
            const input = this.element.querySelector("#player-name") as HTMLInputElement;
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
            observer!.next(...this.playerNames);
        });
    }

    display(): void {
        const listItems: HTMLLIElement[] = this.playerNames.map(name => {
            const li = document.createElement("li");
            li.textContent = name;
            return li;
        });
        this.playerList.replaceChildren(...listItems);
    }
}

export class Game extends GameState {
    private readonly dice: Dice;
    private readonly maxRolls: number = 3;
    private rolls: number = 3;

    private players: Player[] = [];
    private currentIndex: number = 0;

    private readonly rollButton: HTMLButtonElement;
    private readonly nextButton: HTMLButtonElement;
    private readonly endButton: HTMLButtonElement;
    private readonly scoreCardTable: HTMLTableElement;

    private clickedRule: string | null = null;

    constructor() {
        super(document.querySelector("#game-state")!)
        this.scoreCardTable = find(this.element, "#score-card") as HTMLTableElement;
        this.dice = new Dice(find(this.element, ".dice"));
        this.rollButton = find(this.element, "#roll") as HTMLButtonElement;
        this.nextButton = find(this.element, "#next") as HTMLButtonElement;
        this.endButton = find(this.element, "#end") as HTMLButtonElement;
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

    onRuleClick(ruleName: string): void {
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

    onNextClick(): void {
        this.currentIndex = this.nextIndex;
        this.rolls = this.maxRolls;
        this.clickedRule = null;
        this.dice.unfreezeAll();
        this.update();
        this.display();
        disable(this.nextButton);
    }

    update(): void {
        this.dice.update();
        this.currentPlayer.update(...this.dice.values);
        this.rolls--;
    }

    override initialize(...playerNames: string[]): void {
        this.clickedRule = null;
        this.currentIndex = 0;
        this.rolls = 3;
        this.players = playerNames.map(name => 
            new Player(this.htmlElement, this.scoreCardTable, name, this.dice.values.length));
        disable(this.nextButton);
        this.update();
    }

    override attach(observer: StateObserver): void {
        this.rollButton.addEventListener("click", () => {
            if (this.rolls > 0) {
                this.update();
                this.display();
            }
        });

        this.nextButton.addEventListener("click", () => {
            this.onNextClick();
            if (this.isDone) {
                observer.next(...this.players);
            }
        });

        this.endButton.addEventListener("click", () => {
            this.onNextClick();
            observer.next(...this.players);
        });

        this.scoreCardTable.addEventListener("click", (evt: Event) => {
            const target = (evt.target! as HTMLElement).parentNode as HTMLElement;
            if (target.classList.contains("rule")) {
                this.onRuleClick(target.id);
            }
        });
    }

    override display(): void {
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
    private players: Player[] = [];
    private readonly highScoreList: HTMLOListElement;

    constructor() {
        super(document.querySelector("#end-state")!);
        this.highScoreList = this.find("#high-score") as HTMLOListElement;
    }

    override initialize(...players: Player[]): void {
        this.players = players.sort((a, b) => b.scoreState.score - a.scoreState.score);
        this.highScoreList.innerHTML = "";
    }

    override attach(observer: StateObserver): void {
        this.find("#restart").addEventListener("click", () => {
            observer.next();
        });
    }

    override display(): void {
        const listItems: HTMLLIElement[] = this.players.map(player => {
            const li = document.createElement("li");
            li.textContent = `${player.playerName} - ${player.scoreState.score}`;
            return li;
        });
        this.highScoreList.replaceChildren(...listItems);
    }
}