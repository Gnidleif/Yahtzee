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
    freeze() {
        this.logicComponent.freeze();
        this.displayComponent.htmlElement.classList.add("frozen");
    }
    unfreeze() {
        this.logicComponent.unfreeze();
        this.displayComponent.htmlElement.classList.remove("frozen");
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
    }
    get score() {
        return this.logicComponent.score;
    }
    get ruleName() {
        return this.logicComponent.ruleName;
    }
    checkType(type) {
        return this.logicComponent instanceof type;
    }
    update(...values) {
        this.logicComponent.update(...values);
        this.displayComponent.update(this.score);
    }
}
