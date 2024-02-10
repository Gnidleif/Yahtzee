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
    protected htmlElement: HTMLElement;

    constructor(element: HTMLElement) {
        this.htmlElement = element;
        this.hide();
    }

    find(selector: string): HTMLElement {
        return this.htmlElement.querySelector(selector)!;
    }

    hide(): void {
        this.htmlElement.style.display = "none";
    }

    show(displayType: string = "block"): void {
        this.htmlElement.style.display = displayType;
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
    private bonusEarned: boolean = false;
    private bonus: Rule;

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

        this.bonus.update(...numberOfScores);

        if (this.bonus.score > 0) {
            this.bonus.toggle();
            this.rules.splice(6, 0, this.bonus);
            this.bonusEarned = true;
        }
    }

    override update(...diceValues: number[]): void {
        this.rules.forEach(rule => rule.update(...diceValues));
        if (!this.bonusEarned){
            this.checkBonus();
        }
    }

    override display(): void {
        this.show();
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
        this.show("flex");
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
        this.scoreCard.show();
        this.scoreCard.display();
    }
}

export class Start extends GameObject {
    override update(): void {
        throw new Error('Method not implemented.');
    }
    override display(): void {
        this.show();
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