import { hide, show, } from './utils.mjs';
import { Die, Rule, } from './composite.mjs';
import { DieLogic, SumOfLogic, OfAKindLogic, StraightLogic, FullHouseLogic, ChanceLogic, YahtzeeLogic, BonusLogic, PairLogic, } from './logic.mjs';
import { Displayable } from './display.mjs';
export class GameObject extends Displayable {
    constructor(element) {
        super(element);
        hide(this.htmlElement);
    }
}
export class ScoreCard extends GameObject {
    rules;
    bonusAdded = false;
    bonus;
    constructor(element, dieCount) {
        super(element);
        let bonusAim = 0;
        this.rules = Array.from({ length: 6 }, (_, i) => {
            bonusAim += i;
            return new Rule(new SumOfLogic(i + 1));
        });
        bonusAim *= Math.ceil(dieCount / 2);
        this.bonus = new Rule(new BonusLogic(bonusAim));
        this.rules.push(new Rule(new PairLogic(1)), new Rule(new PairLogic(2)), new Rule(new OfAKindLogic(3)), new Rule(new OfAKindLogic(4)), new Rule(new StraightLogic(4)), new Rule(new StraightLogic(5)), new Rule(new FullHouseLogic()), new Rule(new ChanceLogic()), new Rule(new YahtzeeLogic()));
    }
    get score() {
        return this.rules
            .filter(rule => rule.isFrozen)
            .reduce((acc, cur) => acc + cur.score, 0);
    }
    get isDone() {
        return this.rules.every(rule => rule.isFrozen);
    }
    isFrozen(ruleName) {
        return this.rules.find(rule => rule.ruleName === ruleName).isFrozen;
    }
    toggle(ruleName) {
        this.rules.find(rule => rule.ruleName === ruleName).toggle();
    }
    freeze(ruleName) {
        this.rules.find(rule => rule.ruleName === ruleName).freeze();
    }
    checkBonus() {
        const allNumberOfs = this.rules
            .filter(rule => rule.checkType(SumOfLogic));
        const numberOfScores = allNumberOfs
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
    update(...diceValues) {
        this.rules.forEach(rule => rule.update(...diceValues));
        if (!this.bonusAdded) {
            this.checkBonus();
        }
    }
    display() {
        show(this.htmlElement);
        this.htmlElement.replaceChildren(...this.rules.map(rule => rule.display()));
    }
}
export class Dice extends GameObject {
    dice;
    constructor(element, dieCount = 5, sides = 6) {
        super(element);
        this.dice = Array.from({ length: dieCount }, () => new Die(new DieLogic(sides)));
    }
    get values() {
        return this.dice.map(die => die.currentValue);
    }
    unfreezeAll() {
        this.dice.forEach(die => die.unfreeze());
    }
    update() {
        this.dice.forEach(die => die.roll());
    }
    display() {
        show(this.htmlElement, "flex");
        this.htmlElement.replaceChildren(...this.dice.map(die => die.display()));
    }
}
export class Player extends GameObject {
    name;
    scoreCard;
    constructor(element, scoreCardTable, name, dieCount) {
        super(element);
        this.name = name;
        this.scoreCard = new ScoreCard(scoreCardTable, dieCount);
    }
    get playerName() {
        return this.name;
    }
    get scoreState() {
        return this.scoreCard;
    }
    update(...diceValues) {
        this.scoreCard.update(...diceValues);
    }
    display() {
        this.find("#player-name").textContent = this.name;
        this.find("#player-score").textContent = `Score: ${this.scoreCard.score}`;
        this.scoreCard.display();
    }
}
