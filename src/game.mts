import {
    hide,
    show,
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

export abstract class GameObject {
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

export class ScoreCard extends GameObject {
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

export class Dice extends GameObject {
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

export class Player extends GameObject {
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