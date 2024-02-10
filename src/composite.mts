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
    protected readonly displayComponent: Displayable;
    protected readonly logicComponent: ILogic;

    constructor(display: Displayable, logic: ILogic) {
        this.displayComponent = display;
        this.logicComponent = logic;
    }

    display(): HTMLElement {
        return this.displayComponent.htmlElement;
    }
}

class FreezableComposite extends Composite {
    declare protected readonly logicComponent: Freezable;

    constructor(display: Displayable, logic: Freezable) {
        super(display, logic);
        this.displayComponent.htmlElement.classList.add("freezable");
        this.displayComponent.htmlElement.addEventListener("click", () => {
            this.toggle();
        });
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
    declare protected readonly logicComponent: DieLogic;
    declare protected readonly displayComponent: DieDisplay;

    constructor(logicObject: Freezable = new DieLogic(6)) {
        super(new DieDisplay(), logicObject);
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
    declare protected readonly logicComponent: RuleLogicBase;
    declare protected readonly displayComponent: RuleDisplay;

    constructor(logicObject: RuleLogicBase) {
        super(new RuleDisplay(logicObject.ruleName), logicObject);
    }

    get score(): number {
        return this.logicComponent.score;
    }

    checkType(type: any): boolean {
        return this.logicComponent instanceof type;
    }

    update(...values: number[]): void {
        this.logicComponent.update(...values);
        this.displayComponent.update(this.score);
    }
}