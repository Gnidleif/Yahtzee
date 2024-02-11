import {
    hide,
    show,
    disable,
    enable,
    find,
} from './utils.mjs';
import {
    Die,
    Rule,
}
from './composite.mjs';
import {
    DieLogic,
    NumberOfLogic,
    OfAKindLogic,
    StraightLogic,
    FullHouseLogic,
    ChanceLogic,
    YahtzeeLogic,
    BonusLogic,
}
from './logic.mjs';

abstract class GameObject {
    protected readonly htmlElement: HTMLElement;

    constructor(element: HTMLElement) {
        this.htmlElement = element;
        hide(this.htmlElement);
    }

    find(selector: string): HTMLElement {
        return find(this.htmlElement, selector);
    }

    abstract update(): void;
    abstract display(): void;
}

class ScoreCard extends GameObject {
    private readonly rules: Rule[] = [
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
    private bonusAdded: boolean = false;
    private readonly bonus: Rule;

    constructor(element: HTMLTableElement) {
        super(element);
        this.bonus = new Rule(new BonusLogic(63));
    }

    get score(): number {
        return this.rules
            .filter(rule => rule.isFrozen)
            .reduce((acc, cur) => acc + cur.score, 0);
    }

    get isDone(): boolean {
        return this.rules.every(rule => rule.isFrozen);
    }

    isFrozen(ruleName: string): boolean {
        return this.rules.find(rule => rule.ruleName === ruleName)!.isFrozen;
    }

    toggle(ruleName: string): void {
        this.rules.find(rule => rule.ruleName === ruleName)!.toggle();
    }

    freeze(ruleName: string): void {
        this.rules.find(rule => rule.ruleName === ruleName)!.freeze();
    }

    unfreeze(): void {
        this.rules.forEach(rule => rule.unfreeze());
    }

    checkBonus(): void {
        const numberOfScores: number[] = this.rules
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

    override update(...diceValues: number[]): void {
        this.rules.forEach(rule => rule.update(...diceValues));
        if (!this.bonusAdded) {
            this.checkBonus();
        }
    }

    override display(): void {
        show(this.htmlElement);
        this.htmlElement.replaceChildren(...this.rules.map(rule => rule.display()));
    }
}

class Dice extends GameObject {
    private readonly dice: Die[];

    constructor(element: HTMLElement, dieCount: number = 5, sides: number = 6) {
        super(element);
        this.dice = Array.from({ length: dieCount }, 
            () => new Die(new DieLogic(sides)));
    }

    get values(): number[] {
        return this.dice.map(die => die.currentValue);
    }

    unfreeze(): void {
        this.dice.forEach(die => die.unfreeze());
    }

    override update(): void {
        this.dice.forEach(die => die.roll());
    }

    override display(): void {
        show(this.htmlElement, "flex");
        this.htmlElement.replaceChildren(...this.dice.map(die => die.display()));
    }
}

class Player extends GameObject {
    private readonly name: string;
    private readonly scoreCard: ScoreCard;

    constructor(element: HTMLElement, scoreCardTable: HTMLTableElement, name: string) {
        super(element);
        this.name = name;
        this.scoreCard = new ScoreCard(scoreCardTable);
    }

    get playerName(): string {
        return this.name;
    }

    get scoreState(): ScoreCard {
        return this.scoreCard;
    }

    override update(...diceValues: number[]): void {
        this.scoreCard.update(...diceValues);
    }

    override display(): void {
        this.find("#player-name").textContent = this.name;
        this.find("#player-score").textContent = `Score: ${this.scoreCard.score}`;
        this.scoreCard.display();
    }
}

export class Start extends GameObject {
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

    update(): void {
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

class Game extends GameObject {
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

class End extends GameObject {
    private players: Player[];

    constructor(element: HTMLElement, players: Player[]) {
        super(element);
        this.players = players;

        this.find("#restart").addEventListener("click", () => {
            hide(this.htmlElement);
        });
    }

    override update(): void {
        this.players = this.players.sort((a, b) => b.scoreState.score - a.scoreState.score);
    }

    override display(): void {
        show(this.htmlElement);
        const scoreList: HTMLOListElement = this.find("#winner") as HTMLOListElement;
        scoreList.innerHTML = "";
        const listItems: HTMLLIElement[] = this.players.map(player => {
            const li = document.createElement("li");
            li.textContent = `${player.playerName} - ${player.scoreState.score}`;
            return li;
        });
        scoreList.replaceChildren(...listItems);
    }
}