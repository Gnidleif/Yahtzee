//#region Base
export class Freezable {
    frozen = false;
    get isFrozen() {
        return this.frozen;
    }
    toggle() {
        this.frozen = !this.frozen;
    }
    freeze() {
        this.frozen = true;
    }
    unfreeze() {
        this.frozen = false;
    }
}
//#endregion
//#region Die
export class DieLogicBase extends Freezable {
    value = 0;
    sides;
    constructor(sides) {
        super();
        this.sides = sides;
    }
    get currentValue() {
        return this.value;
    }
    get sidesCount() {
        return this.sides;
    }
    roll() {
        if (!super.isFrozen) {
            this.value = this.calculate();
        }
    }
}
export class DieLogic extends DieLogicBase {
    calculate() {
        return Math.floor(Math.random() * this.sidesCount) + 1;
    }
}
//#endregion
//#region Rule
export class RuleLogicBase extends Freezable {
    name;
    currentScore = 0;
    constructor(name) {
        super();
        this.name = (name || new.target.name).replace("Logic", "");
    }
    get ruleName() {
        return this.name;
    }
    get score() {
        return this.currentScore;
    }
    update(...values) {
        if (!this.isFrozen) {
            this.currentScore = this.calculate(...values);
        }
    }
}
export class NumberOfLogic extends RuleLogicBase {
    tracked;
    constructor(tracked) {
        super(new.target.name + tracked);
        this.tracked = tracked;
    }
    get trackedNumber() {
        return this.tracked;
    }
    calculate(...values) {
        return values
            .filter(val => val === this.tracked)
            .reduce((acc, cur) => acc + cur, 0);
    }
}
export class OfAKindLogic extends RuleLogicBase {
    tracked;
    constructor(tracked) {
        super(new.target.name + tracked);
        this.tracked = tracked;
    }
    calculate(...values) {
        const counts = values
            .reduce((acc, cur) => acc.set(cur, (acc.get(cur) || 0) + 1), new Map());
        const highestScore = Math.max(...Array.from(counts.keys())
            .filter((key) => counts.get(key) >= this.tracked));
        return highestScore > 0
            ? highestScore * this.tracked
            : 0;
    }
}
export class StraightLogic extends RuleLogicBase {
    length;
    constructor(length) {
        super(new.target.name + length);
        this.length = length;
    }
    calculate(...values) {
        const sorted = values.sort((a, b) => a - b);
        if (sorted.length < this.length) {
            return 0;
        }
        let count = 1;
        let highestCount = 1;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === sorted[i - 1] + 1) {
                count++;
                highestCount = Math.max(count, highestCount);
            }
            else if (sorted[i] !== sorted[i - 1]) {
                count = 1;
            }
        }
        return highestCount >= this.length
            ? 10 * this.length
            : 0;
    }
}
export class FullHouseLogic extends RuleLogicBase {
    constructor() {
        super(new.target.name);
    }
    calculate(...values) {
        const counts = values
            .reduce((acc, cur) => acc.set(cur, (acc.get(cur) || 0) + 1), new Map());
        const lowCount = Math.floor(values.length / 2);
        const highCount = Math.ceil(values.length / 2);
        const mapValues = Array.from(counts.values());
        return mapValues.includes(lowCount) && mapValues.includes(highCount)
            ? 50
            : 0;
    }
}
export class ChanceLogic extends RuleLogicBase {
    constructor() {
        super(new.target.name);
    }
    calculate(...values) {
        return values.reduce((acc, cur) => acc + cur, 0);
    }
}
export class YahtzeeLogic extends RuleLogicBase {
    constructor() {
        super(new.target.name);
    }
    calculate(...values) {
        return values.every(val => val === values[0])
            ? 100
            : 0;
    }
}
export class BonusLogic extends RuleLogicBase {
    target;
    constructor(target) {
        super(new.target.name + target);
        this.target = target;
    }
    calculate(...values) {
        return values.reduce((acc, cur) => acc + cur, 0) >= this.target
            ? 25
            : 0;
    }
}
//#endregion
