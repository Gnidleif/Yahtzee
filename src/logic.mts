//#region Base

export interface ILogic {
    calculate(...values : number[]): number;
}

export abstract class Freezable implements ILogic {
    private frozen: boolean = false;

    abstract calculate(...values: number[]): number;

    get isFrozen(): boolean {
        return this.frozen;
    }

    toggle(): void {
        this.frozen = !this.frozen;
    }

    freeze(): void {
        this.frozen = true;
    }

    unfreeze(): void {
        this.frozen = false;
    }
}

//#endregion

//#region Die

export abstract class DieLogicBase extends Freezable {
    private value: number = 0;
    private sides: number = 0;

    constructor(sides: number) {
        super();
        this.sides = sides;
    }

    get currentValue(): number {
        return this.value;
    }

    get sidesCount(): number {
        return this.sides;
    }

    roll(): void {
        if (!super.isFrozen) {
            this.value = this.calculate();
        }
    }
}

export class DieLogic extends DieLogicBase {
    override calculate(): number {
        return Math.floor(Math.random() * this.sidesCount) + 1;
    }
}

//#endregion

//#region Rule

export abstract class RuleLogicBase extends Freezable {
    private name: string;
    private score: number = 0;

    constructor(name: string) {
        super();
        this.name = (name || new.target.name).replace("Logic", "");
    }

    get ruleName(): string {
        return this.name;
    }

    get currentScore(): number {
        return this.score;
    }

    update(...values: number[]): void {
        if (!this.isFrozen) {
            this.score = this.calculate(...values);
        }
    }
}

export class NumberOfLogic extends RuleLogicBase {
    private tracked: number = 0;

    constructor(tracked: number) {
        super(new.target.name);
        this.tracked = tracked;
    }

    override calculate(...values: number[]): number {
        return values
            .filter(val => val === this.tracked)
            .reduce((acc, cur) => acc + cur, 0);
    }
}

export class OfAKindLogic extends RuleLogicBase {
    private tracked: number = 0;

    constructor(tracked: number) {
        super(new.target.name + tracked);
        this.tracked = tracked;
    }

    override calculate(...values: number[]): number {
        const counts: Map<number, number> = values
            .reduce((acc: Map<number, number>, cur: number) => 
                acc.set(cur, (acc.get(cur) || 0) + 1), 
                new Map<number, number>());

        const highestScore: number = Math.max(...Array.from(counts.keys())
            .filter((key: number) => counts.get(key)! >= this.tracked));

        return highestScore > 0
            ? highestScore * this.tracked
            : 0;
    }
}

export class StraightLogic extends RuleLogicBase {
    private length: number = 0;

    constructor(length: number) {
        super(new.target.name + length);
        this.length = length;
    }

    override calculate(...values: number[]): number {
        const sorted: number[] = values.sort((a, b) => a - b);
        if (sorted.length < this.length) {
            return 0;
        }

        let count: number = 1;
        let highestCount: number = 1;
        for (let i: number = 1; i < sorted.length; i++) {
            if (sorted[i] === sorted[i - 1] + 1) {
                count++;
                highestCount = Math.max(count, highestCount);
            } else if (sorted[i] !== sorted[i - 1]) {
                count = 1;
            }
        }

        return highestCount >= this.length
            ? 10 * this.length
            : 0;
    }
}

export class FullHouseLogic extends RuleLogicBase {
    constructor(){
        super(new.target.name);
    }

    override calculate(...values: number[]): number {
        const counts: Map<number, number> = values
            .reduce((acc: Map<number, number>, cur: number) => 
                acc.set(cur, (acc.get(cur) || 0) + 1), 
                new Map<number, number>());

        const lowCount: number = Math.floor(values.length / 2);
        const highCount: number = Math.ceil(values.length / 2);

        const mapValues: number[] = Array.from(counts.values());

        return mapValues.includes(lowCount) && mapValues.includes(highCount)
            ? 50
            : 0;
    }
}

export class ChanceLogic extends RuleLogicBase {
    constructor(){
        super(new.target.name);
    }

    override calculate(...values: number[]): number {
        return values.reduce((acc, cur) => acc + cur, 0);
    }
}

export class YahtzeeLogic extends RuleLogicBase {
    constructor(){
        super(new.target.name);
    }

    override calculate(...values: number[]): number {
        return values.every(val => val === values[0])
            ? 100
            : 0;
    }
}

export class BonusLogic extends RuleLogicBase {
    private target: number = 0;

    constructor(target: number) {
        super(new.target.name + target);
        this.target = target;
    }

    override calculate(...values: number[]): number {
        return values.reduce((acc, cur) => acc + cur, 0) >= this.target
            ? 25
            : 0;
    }
}

//#endregion

//#region Player

export class PlayerLogic implements ILogic {
    private name: string;
    private score: number = 0;
    private dice: DieLogicBase[];

    constructor(name: string, numDice: number = 5) {
        this.name = name;
        this.dice = Array.from({ length: numDice }, () => new DieLogic(6));
    }

    get playerName(): string {
        return this.name;
    }

    get currentScore(): number {
        return this.score;
    }

    get diceValues() : number[] {
        return this.dice.map(die => die.currentValue);
    }

    roll(): void {
        this.dice.forEach(die => die.roll());
        this.score = this.calculate(...this.diceValues);
    }

    calculate(...values: number[]): number {
        return values.reduce((acc, cur) => acc + cur, 0);
    }
}

//#endregion