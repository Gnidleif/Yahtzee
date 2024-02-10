/**
 * composite.mts
 * Composites are object made up of two parts: a displayable and a logic component.
 */

import {
    Displayable,
    DieDisplay,
    RuleDisplay,
} from "./display.mjs";
import {
    ILogic,
    DieLogic,
    Freezable,
    RuleLogicBase,
} from "./logic.mjs";

abstract class Composite {
    protected displayComponent: Displayable;
    protected logicComponent: ILogic;

    constructor(display: Displayable, logic: ILogic) {
        this.displayComponent = display;
        this.logicComponent = logic;
    }

    display(): HTMLElement {
        return this.displayComponent.htmlElement;
    }
}

class FreezableComposite extends Composite {
    declare protected logicComponent: Freezable;

    constructor(display: Displayable, logic: Freezable) {
        super(display, logic);
        this.displayComponent.htmlElement.classList.add("freezable");
    }

    get isFrozen(): boolean {
        return this.logicComponent.isFrozen;
    }

    toggle(): void {
        this.logicComponent.toggle();
        this.displayComponent.htmlElement.classList.toggle("frozen");
    }
}

export class Die extends FreezableComposite {
    declare protected logicComponent: DieLogic;
    declare protected displayComponent: DieDisplay;

    constructor(logicObject: Freezable = new DieLogic(6)) {
        super(new DieDisplay(), logicObject);

        this.displayComponent.htmlElement.addEventListener("click", () => {
            this.toggle();
        });
    }

    get currentValue(): number {
        return this.logicComponent.currentValue;
    }

    roll(): void {
        this.logicComponent.roll();
        this.displayComponent.update(this.currentValue);
    }
}

export class Rule extends FreezableComposite {
    declare protected logicComponent: RuleLogicBase;
    declare protected displayComponent: RuleDisplay;

    constructor(logicObject: RuleLogicBase) {
        super(new RuleDisplay(logicObject.ruleName), logicObject);

        this.displayComponent.htmlElement.addEventListener("click", () => {
            if (!this.isFrozen) {
                this.toggle();
            }
        });
    }

    get score(): number {
        return this.logicComponent.score;
    }

    update(...values: number[]): void {
        this.logicComponent.update(...values);
        this.displayComponent.update(this.score);
    }
}