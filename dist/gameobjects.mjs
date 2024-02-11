import { hide, show, find, } from './utils.mjs';
import { Die, Rule, } from './composite.mjs';
import { DieLogic, NumberOfLogic, OfAKindLogic, StraightLogic, FullHouseLogic, ChanceLogic, YahtzeeLogic, BonusLogic, } from './logic.mjs';
export class GameObject {
    htmlElement;
    constructor(element) {
        this.htmlElement = element;
        hide(this.htmlElement);
    }
    find(selector) {
        return find(this.htmlElement, selector);
    }
}
export class ScoreCard extends GameObject {
    rules = [
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
    bonusAdded = false;
    bonus;
    constructor(element) {
        super(element);
        this.bonus = new Rule(new BonusLogic(63));
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
            .filter(rule => rule.checkType(NumberOfLogic));
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
    constructor(element, scoreCardTable, name) {
        super(element);
        this.name = name;
        this.scoreCard = new ScoreCard(scoreCardTable);
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
