/**
 * composite.mts
 * Composites are object made up of two parts: a displayable and a logic component.
 */

import {
    Displayable,
    DieDisplay,
    RuleDisplay,
    PlayerDisplay,
    ScoreCardDisplay,
} from "./display.mjs";
import {
    ILogic,
    DieLogic,
    Freezable,
    RuleLogicBase,
    ScoreCardLogic,
    PlayerLogic,
} from "./logic.mjs";

export abstract class Composite {
    protected displayComponent: Displayable;
    protected logicComponent: ILogic;

    constructor(display: Displayable, logic: ILogic) {
        this.displayComponent = display;
        this.logicComponent = logic;
    }

    get htmlElement(): HTMLElement {
        return this.displayComponent.htmlElement;
    }

    calculate(...values: number[]): number {
        return this.logicComponent.calculate(...values);
    }

    display(): HTMLElement {
        return this.displayComponent.display();
    }
}

export class FreezableComposite extends Composite {
    declare logicComponent: Freezable;

    constructor(display: Displayable, logic: Freezable) {
        super(display, logic);

        this.htmlElement.addEventListener("click", () => {
            this.logicComponent.toggle();
            this.htmlElement.classList.toggle("frozen");
        });
    }
}

export class Die extends FreezableComposite {
    declare logicComponent: DieLogic;
    declare displayComponent: DieDisplay;

    constructor(logicObject: Freezable = new DieLogic(6)) {
        super(new DieDisplay(), logicObject);
    }

    roll(): void {
        this.logicComponent.roll();
        this.displayComponent.update(this.logicComponent.currentValue);
    }
}

export class Rule extends FreezableComposite {
    declare logicComponent: RuleLogicBase;
    declare displayComponent: RuleDisplay;

    constructor(logicObject: RuleLogicBase) {
        super(new RuleDisplay(logicObject.ruleName), logicObject);
    }

    check(...values: number[]): void {
        this.logicComponent.update(...values);
        this.displayComponent.update(this.logicComponent.currentScore);
    }
}

export class ScoreCard extends Composite {
    declare logicComponent: ScoreCardLogic;
    declare displayComponent: ScoreCardDisplay;

    constructor() {
        super(new ScoreCardDisplay(), new ScoreCardLogic());
    }
}

export class Player extends Composite {
    declare logicComponent: PlayerLogic;
    declare displayComponent: PlayerDisplay;

    private dice: Die[];
    private scoreCard: ScoreCard = new ScoreCard();

    constructor(name: string, dieCount: number = 5) {
        super(new PlayerDisplay(name), new PlayerLogic(name));
        this.dice = Array.from({ length: dieCount }, () => new Die());

        this.htmlElement.appendChild(this.scoreCard.display());

        // Rolling will be done by the Game class later
    }

    rollDice() {
        this.dice.forEach(die => die.roll());
        this.scoreCard.calculate(...this.dice.map(die => die.logicComponent.currentValue));
    }

    display(): HTMLElement {
        this.htmlElement.querySelector(".dice")!.replaceChildren(...this.dice.map(die => die.display()));
        this.htmlElement.querySelector(".score-card")!.replaceWith(this.scoreCard.display());
        return this.displayComponent.display();
    }
}