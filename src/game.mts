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
    private bonusAdded: boolean = false;
    private readonly bonus: Rule;

    constructor(element: HTMLElement) {
        super(element);
        this.bonus = new Rule(new BonusLogic(63));
    }

    get score(): number {
        return this.rules
            .filter(rule => rule.isFrozen)
            .reduce((acc, cur) => acc + cur.score, 0);
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
    private score: number = 0;
    private readonly scoreCard: ScoreCard;

    constructor(element: HTMLElement, name: string) {
        super(element);
        this.name = name;
        this.scoreCard = new ScoreCard(this.find("#score-card"));
    }

    get playerName(): string {
        return this.name;
    }

    override update(...diceValues: number[]): void {
        this.scoreCard.update(...diceValues);
        this.score = this.scoreCard.score;
    }

    override display(): void {
        this.find("#player-name").textContent = this.name;
        this.find("#player-score").textContent = `Score: ${this.score}`;
        this.scoreCard.display();
    }
}

export class Start {
    private readonly htmlElement: HTMLElement;
    private readonly addForm: HTMLElement;
    private readonly addButton: HTMLButtonElement;
    private readonly startButton: HTMLButtonElement;
    private readonly playerList: HTMLOListElement;
    private readonly playerNames: string[] = [];

    constructor(element: HTMLElement) {
        this.htmlElement = element;
        this.addForm = find(this.htmlElement, "#add-player");
        this.addButton = find(this.htmlElement, "#add-button") as HTMLButtonElement;
        this.startButton = find(this.htmlElement, "#start-game") as HTMLButtonElement;
        this.playerList = find(this.htmlElement, "#player-list") as HTMLOListElement;

        this.addForm.querySelector("#player-name")!.addEventListener("input", (evt: Event) => {
            const target = evt.target! as HTMLInputElement;
            if (target.value.length >= 3) {
                enable(this.addButton);
            }
        });

        this.addButton.addEventListener("click", () => {
            const input = this.addForm.querySelector("#player-name") as HTMLInputElement;
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

    display(): void {
        show(this.htmlElement);
        this.playerList.replaceChildren(...this.playerNames.map(name => {
            const li = document.createElement("li");
            li.textContent = name;
            return li;
        }));
    }
}

export class Game extends GameObject {
    private readonly players: Player[];
    private currentIndex: number = 0;

    private readonly dice: Dice;
    private readonly maxRolls: number = 3;
    private rolls: number = 3;

    private readonly rollButton: HTMLButtonElement;
    private readonly nextButton: HTMLButtonElement;

    constructor(element: HTMLElement, playerNames: string[]) {
        super(element);
        this.players = playerNames
            .map(name => new Player(element, name));
        this.dice = new Dice(element.querySelector(".dice")!);

        this.rollButton = this.htmlElement.querySelector("#roll")!;
        this.rollButton.addEventListener("click", () => {
            if (this.rolls > 0) {
                this.rolls--;
                this.update();
                this.display();
            }
        });

        this.nextButton = this.htmlElement.querySelector("#next")!;

        this.nextButton.addEventListener("click", () => {
            this.currentIndex = this.nextIndex;
            this.rolls = this.maxRolls;
            this.update();
            this.display();
        });
    }
    
    get currentPlayer(): Player {
        return this.players[this.currentIndex];
    }

    get nextIndex(): number {
        return (this.currentIndex + 1) % this.players.length;
    }

    override update(): void {
        this.dice.update();
        this.currentPlayer.update(...this.dice.values);
    }

    override display(): void {
        this.rollButton.textContent = `Roll: ${this.rolls}`;
        this.nextButton.textContent = `Next: ${this.players[this.nextIndex].playerName}`;
        this.dice.display();
        this.currentPlayer.display();
    }
}

export class End extends GameObject {
    override update(): void {
        throw new Error('Method not implemented.');
    }
    override display(): void {
        throw new Error('Method not implemented.');
    }
}