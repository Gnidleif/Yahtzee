//#region Base

export abstract class Displayable {
    protected element: HTMLElement;

    constructor(element: HTMLElement) {
        this.element = element;
    }

    get htmlElement(): HTMLElement {
        return this.element;
    }
}

//#endregion

//#region Die

export class DieDisplay extends Displayable {
    private dots: HTMLDivElement[] = [];

    constructor() {
        super(document.createElement("div"));
        this.element.classList.add("die");
    }

    get dotsCount(): number {
        return this.dots.length;
    }

    update(dotCount: number): void {
        if (dotCount < 1 || dotCount > 6) {
            throw new RangeError("Dot count must be between 1 and 6");
        }
        this.dots = Array.from({ length: dotCount }, () => {
            const dot: HTMLDivElement = document.createElement("div");
            dot.classList.add("dot");
            return dot;
        });

        this.element.replaceChildren(...this.dots);
    }
}

//#endregion

//#region Rule

export class RuleDisplay extends Displayable {
    private scoreCell: HTMLTableCellElement;

    constructor(id: string) {
        super(document.createElement("tr"));
        this.element.classList.add("rule");

        const nameCell = document.createElement("td");
        nameCell.textContent = id;
        this.element.appendChild(nameCell);

        this.scoreCell = document.createElement("td");
        this.element.appendChild(this.scoreCell);
    }

    update(score: number): void {
        if (score < 0) {
            throw new RangeError("Score must be greater than or equal to 0");
        }
        this.scoreCell.textContent = score.toString();
    }
}

//#endregion