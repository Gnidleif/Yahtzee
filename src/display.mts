//#region Base classes

export interface IDisplay {
    update(...values: number[]): void;
    display(): HTMLElement;
}

export abstract class Displayable implements IDisplay {
    protected element: HTMLElement;

    constructor(element: HTMLElement) {
        this.element = element;
    }

    get htmlElement(): HTMLElement {
        return this.element;
    }

    abstract update(...values: number[]): void;
    abstract display(): HTMLElement;
}

//#endregion

//#region Die classes

export class DieDisplay extends Displayable {
    private dots: HTMLDivElement[] = [];

    constructor() {
        super(document.createElement("div"));
        this.element.classList.add("die");
    }

    get dotsCount(): number {
        return this.dots.length;
    }

    override update(dotCount: number): void {
        if (dotCount < 1 || dotCount > 6) {
            throw new RangeError("Dot count must be between 1 and 6");
        }
        this.dots = Array.from({ length: dotCount }, () => {
            const dot: HTMLDivElement = document.createElement("div");
            dot.classList.add("dot");
            return dot;
        });
    }

    override display(): HTMLElement {
        this.element.querySelectorAll(".dot")?.forEach(dot => dot.remove());
        this.dots.forEach(dot => this.element.appendChild(dot));

        return this.element;
    }
}

//#endregion

//#region Rule classes

export class RuleDisplay extends Displayable {
    private id: string;
    private scoreText: string = "";

    constructor(id: string) {
        super(document.createElement("tr"));
        this.id = id;

        this.element.classList.add("rule");
        this.element.id = this.id;

        const nameCell: HTMLTableCellElement = document.createElement("td");
        nameCell.textContent = this.id;
        this.element.appendChild(nameCell);

        const scoreCell: HTMLTableCellElement = document.createElement("td");
        scoreCell.classList.add("score");
        scoreCell.textContent = this.scoreText;
        this.element.appendChild(scoreCell);
    }

    override update(score: number): void {
        if (score < 0) {
            throw new RangeError("Score must be greater than or equal to 0");
        }
        this.scoreText = score.toString();
    }

    override display(): HTMLElement {
        this.element.querySelector(".score")!.textContent = this.scoreText;
        return this.element;
    }
}

//#endregion

export class PlayerDisplay extends Displayable {
    private name: string;
    private dice: DieDisplay[] = [];
    private scoreText: string = "";

    constructor(name: string, diceCount: number = 5) {
        super(document.createElement("section"));
        this.name = name;
        this.element.classList.add("player");
        const nameElement: HTMLHeadingElement = document.createElement("h2");
        nameElement.textContent = this.name;
        this.element.appendChild(nameElement);

        const scoreElement: HTMLHeadingElement = document.createElement("h3");
        scoreElement.classList.add("score");
        scoreElement.textContent = this.scoreText;
        this.element.appendChild(scoreElement);

        const diceElement: HTMLDivElement = document.createElement("div");
        diceElement.classList.add("dice");
        this.element.appendChild(diceElement);
        this.dice = Array.from({ length: diceCount }, () => new DieDisplay());

        const rollButton: HTMLButtonElement = document.createElement("button");
        rollButton.id = "roll";
        rollButton.textContent = "Roll";
        this.element.appendChild(rollButton);
    }

    override update(score: number, ...dieValues: number[]): void {
        if (score < 0) {
            throw new RangeError("Score must be greater than or equal to 0");
        }
        this.scoreText = `Score: ${score}`;
        this.dice.forEach((die, index) => die.update(dieValues[index]));
    }

    override display(): HTMLElement {
        const diceElement: HTMLDivElement = this.element.querySelector(".dice")!;
        diceElement.querySelectorAll(".die")?.forEach(die => die.remove());
        this.dice.forEach(die => diceElement.appendChild(die.display()));
        this.element.querySelector(".score")!.textContent = this.scoreText;
        return this.element;
    }
}