/**
 * composite.mts
 * Composites are object made up of two parts: a displayable and a logic component.
 */
import { DieDisplay, RuleDisplay, PlayerDisplay, ScoreCardDisplay, } from "./display.mjs";
import { DieLogic, ScoreCardLogic, PlayerLogic, } from "./logic.mjs";
export class Composite {
    displayComponent;
    logicComponent;
    constructor(display, logic) {
        this.displayComponent = display;
        this.logicComponent = logic;
    }
    get htmlElement() {
        return this.displayComponent.htmlElement;
    }
    calculate(...values) {
        return this.logicComponent.calculate(...values);
    }
    display() {
        return this.displayComponent.display();
    }
}
export class FreezableComposite extends Composite {
    constructor(display, logic) {
        super(display, logic);
        this.htmlElement.addEventListener("click", () => {
            this.logicComponent.toggle();
            this.htmlElement.classList.toggle("frozen");
        });
    }
}
export class Die extends FreezableComposite {
    constructor(logicObject = new DieLogic(6)) {
        super(new DieDisplay(), logicObject);
    }
    roll() {
        this.logicComponent.roll();
        this.displayComponent.update(this.logicComponent.currentValue);
    }
}
export class Rule extends FreezableComposite {
    constructor(logicObject) {
        super(new RuleDisplay(logicObject.ruleName), logicObject);
    }
    check(...values) {
        this.logicComponent.update(...values);
        this.displayComponent.update(this.logicComponent.currentScore);
    }
}
export class ScoreCard extends Composite {
    constructor() {
        super(new ScoreCardDisplay(), new ScoreCardLogic());
    }
}
export class Player extends Composite {
    dice;
    scoreCard = new ScoreCard();
    constructor(name, dieCount = 5) {
        super(new PlayerDisplay(name), new PlayerLogic(name));
        this.dice = Array.from({ length: dieCount }, () => new Die());
        this.htmlElement.appendChild(this.scoreCard.display());
        // Rolling will be done by the Game class later
    }
    rollDice() {
        this.dice.forEach(die => die.roll());
        this.scoreCard.calculate(...this.dice.map(die => die.logicComponent.currentValue));
    }
    display() {
        this.htmlElement.querySelector(".dice").replaceChildren(...this.dice.map(die => die.display()));
        this.htmlElement.querySelector(".score-card").replaceWith(this.scoreCard.display());
        return this.displayComponent.display();
    }
}
