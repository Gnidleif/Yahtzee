/**
 * composite.mts
 * Composites are object made up of two parts: a displayable and a logic component.
 */
import { DieDisplay, RuleDisplay, } from "./display.mjs";
import { DieLogic, } from "./logic.mjs";
class Composite {
    displayComponent;
    logicComponent;
    constructor(display, logic) {
        this.displayComponent = display;
        this.logicComponent = logic;
    }
    display() {
        return this.displayComponent.htmlElement;
    }
}
class FreezableComposite extends Composite {
    constructor(display, logic) {
        super(display, logic);
        this.displayComponent.htmlElement.classList.add("freezable");
    }
    get isFrozen() {
        return this.logicComponent.isFrozen;
    }
    toggle() {
        this.logicComponent.toggle();
        this.displayComponent.htmlElement.classList.toggle("frozen");
    }
}
export class Die extends FreezableComposite {
    constructor(logicObject = new DieLogic(6)) {
        super(new DieDisplay(), logicObject);
        this.displayComponent.htmlElement.addEventListener("click", () => {
            this.toggle();
        });
    }
    get currentValue() {
        return this.logicComponent.currentValue;
    }
    roll() {
        this.logicComponent.roll();
        this.displayComponent.update(this.currentValue);
    }
}
export class Rule extends FreezableComposite {
    constructor(logicObject) {
        super(new RuleDisplay(logicObject.ruleName), logicObject);
        this.displayComponent.htmlElement.addEventListener("click", () => {
            if (!this.isFrozen) {
                this.toggle();
            }
        });
    }
    get score() {
        return this.logicComponent.score;
    }
    checkType(type) {
        return this.logicComponent instanceof type;
    }
    update(...values) {
        this.logicComponent.update(...values);
        this.displayComponent.update(this.score);
    }
}
