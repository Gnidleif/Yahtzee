import * as d from "./display.mjs";
import * as l from "./logic.mjs";

export abstract class Composite {
    protected displayComponent: d.IDisplay;
    protected logicComponent: l.ILogic;

    constructor(display: d.IDisplay, logic: l.ILogic) {
        this.displayComponent = display;
        this.logicComponent = logic;
    }

    calculate(...values: number[]): number {
        return this.logicComponent.calculate(...values);
    }

    display(): HTMLElement {
        return this.displayComponent.display();
    }
}

abstract class FreezableComposite extends Composite {
    declare protected logicComponent: l.Freezable;
    declare protected displayComponent: d.Displayable;

    constructor(displayObject: d.IDisplay, logicObject: l.Freezable) {
        super(displayObject, logicObject);

        this.htmlElement.addEventListener("click", () => {
            this.htmlElement.classList.toggle("frozen");
            this.logicComponent.toggle();
        });
    }

    get htmlElement(): HTMLElement {
        return this.displayComponent.htmlElement;
    }
}

export class Die extends FreezableComposite {
    declare protected logicComponent: l.DieLogic;

    constructor(logicObject: l.Freezable = new l.DieLogic(6)) {
        super(new d.DieDisplay(), logicObject);
    }

    roll(): void {
        this.logicComponent.roll();
        this.displayComponent.update(this.logicComponent.currentValue);
    }
}

export class Rule extends FreezableComposite {
    declare protected logicComponent: l.RuleLogicBase;

    constructor(logicObject: l.RuleLogicBase) {
        super(new d.RuleDisplay(logicObject.ruleName), logicObject);
    }

    check(...values: number[]): void {
        this.logicComponent.update(...values);
        this.displayComponent.update(this.logicComponent.currentScore);
    }
}

export class Player extends Composite {
    declare protected displayComponent: d.Displayable;
    declare protected logicComponent: l.PlayerLogic;

    constructor(name: string) {
        super(new d.PlayerDisplay(name), new l.PlayerLogic(name));

        this.displayComponent.htmlElement.querySelector("#roll")!.addEventListener("click", this.roll);
    }

    roll() {
        this.logicComponent.roll();
        this.displayComponent.update(this.logicComponent.currentScore, ...this.logicComponent.diceValues);
    }
}