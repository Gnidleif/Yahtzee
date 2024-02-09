import * as d from "./display.mjs";
import * as l from "./logic.mjs";
export class Composite {
    displayComponent;
    logicComponent;
    constructor(display, logic) {
        this.displayComponent = display;
        this.logicComponent = logic;
    }
    calculate(...values) {
        return this.logicComponent.calculate(...values);
    }
    display() {
        return this.displayComponent.display();
    }
}
class FreezableComposite extends Composite {
    constructor(displayObject, logicObject) {
        super(displayObject, logicObject);
        this.htmlElement.addEventListener("click", () => {
            this.htmlElement.classList.toggle("frozen");
            this.logicComponent.toggle();
        });
    }
    get htmlElement() {
        return this.displayComponent.htmlElement;
    }
}
export class Die extends FreezableComposite {
    constructor(logicObject = new l.DieLogic(6)) {
        super(new d.DieDisplay(), logicObject);
    }
    roll() {
        this.logicComponent.roll();
        this.displayComponent.update(this.logicComponent.currentValue);
    }
}
export class Rule extends FreezableComposite {
    constructor(logicObject) {
        super(new d.RuleDisplay(logicObject.ruleName), logicObject);
    }
    check(...values) {
        this.logicComponent.update(...values);
        this.displayComponent.update(this.logicComponent.currentScore);
    }
}
export class Player extends Composite {
    constructor(name) {
        super(new d.PlayerDisplay(name), new l.PlayerLogic(name));
        this.displayComponent.htmlElement.querySelector("#roll").addEventListener("click", this.roll);
    }
    roll() {
        this.logicComponent.roll();
        this.displayComponent.update(this.logicComponent.currentScore, ...this.logicComponent.diceValues);
    }
}
