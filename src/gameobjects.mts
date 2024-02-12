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
    SumOfLogic,
    OfAKindLogic,
    StraightLogic,
    FullHouseLogic,
    ChanceLogic,
    YahtzeeLogic,
    BonusLogic,
    PairLogic,
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
    private readonly rules: Rule[];
    private bonusAdded: boolean = false;
    private readonly bonus: Rule;

    constructor(element: HTMLTableElement, dieCount: number) {
        super(element);
        let bonusAim = 0;
        this.rules = [];
        for (let i = 1; i <= 6; i++) {
            this.rules.push(new Rule(new SumOfLogic(i)));
            bonusAim += i;
        }
        bonusAim *= Math.ceil(dieCount / 2);
        this.bonus = new Rule(new BonusLogic(bonusAim));
        this.rules.push(new Rule(new PairLogic(1)));
        this.rules.push(new Rule(new PairLogic(2)));
        this.rules.push(new Rule(new OfAKindLogic(3)));
        this.rules.push(new Rule(new OfAKindLogic(4)));
        this.rules.push(new Rule(new StraightLogic(4)));
        this.rules.push(new Rule(new StraightLogic(5)));
        this.rules.push(new Rule(new FullHouseLogic()));
        this.rules.push(new Rule(new ChanceLogic()));
        this.rules.push(new Rule(new YahtzeeLogic()));
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

    checkBonus(): void {
        const allNumberOfs: Rule[] = this.rules
            .filter(rule => rule.checkType(SumOfLogic));

        const numberOfScores: number[] = allNumberOfs
            .filter(rule => rule.isFrozen)
            .map(rule => rule.score);

        if (numberOfScores.length === 0) {
            return;
        }

        this.bonus.update(...numberOfScores);

        if (this.bonus.score > 0 || numberOfScores.length === allNumberOfs.length) {
            this.bonus.toggle();
            this.rules.splice(allNumberOfs.length, 0, this.bonus);
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

    unfreezeAll(): void {
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

    constructor(element: HTMLElement, scoreCardTable: HTMLTableElement, name: string, dieCount: number) {
        super(element);
        this.name = name;
        this.scoreCard = new ScoreCard(scoreCardTable, dieCount);
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