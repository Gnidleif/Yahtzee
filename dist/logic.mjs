export class FreezableBase {
    frozen = false;
    get isFrozen() {
        return this.frozen;
    }
    freeze() {
        this.frozen = true;
    }
    unfreeze() {
        this.frozen = false;
    }
}
export class DieLogicBase extends FreezableBase {
    value = 0;
    sides = 0;
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
export class RuleLogicBase extends FreezableBase {
    name = "";
    score = 0;
    constructor(name) {
        super();
        this.name = (name || new.target.name).replace("Logic", "");
    }
    get ruleName() {
        return this.name;
    }
    get currentScore() {
        return this.score;
    }
    update(...values) {
        if (!this.isFrozen) {
            this.score = this.calculate(...values);
        }
    }
}
export class NumberOfLogic extends RuleLogicBase {
    tracked = 0;
    constructor(tracked) {
        super(new.target.name);
        this.tracked = tracked;
    }
    calculate(...values) {
        return values
            .filter(val => val === this.tracked)
            .reduce((acc, cur) => acc + cur, 0);
    }
}
export class OfAKindLogic extends RuleLogicBase {
    tracked = 0;
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
    length = 0;
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
    calculate(...values) {
        return values.reduce((acc, cur) => acc + cur, 0);
    }
}
export class YahtzeeLogic extends RuleLogicBase {
    calculate(...values) {
        return values.every(val => val === values[0])
            ? 100
            : 0;
    }
}
export class BonusLogic extends RuleLogicBase {
    target = 0;
    constructor(target) {
        super(new.target.name);
        this.target = target;
    }
    calculate(...values) {
        return values.reduce((acc, cur) => acc + cur, 0) >= this.target
            ? 35
            : 0;
    }
}
