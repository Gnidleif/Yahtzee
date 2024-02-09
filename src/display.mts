//#region Base

export abstract class Displayable {
    protected element: HTMLElement;

    constructor(element: HTMLElement) {
        this.element = element;
    }

    get htmlElement(): HTMLElement {
        return this.element;
    }

    abstract display(): HTMLElement;
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
    }

    override display(): HTMLElement {
        this.element.querySelectorAll(".dot")?.forEach(dot => dot.remove());
        this.dots.forEach(dot => this.element.appendChild(dot));

        return this.element;
    }
}

//#endregion

//#region Rule

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

    update(score: number): void {
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

//#region ScoreCard

export class ScoreCardDisplay extends Displayable {
    constructor() {
        super(document.createElement("table"));
        this.element.classList.add("score-card");

        const header: HTMLTableRowElement = document.createElement("tr");
        const nameHeader: HTMLTableCellElement = document.createElement("th");
        nameHeader.textContent = "Name";
        header.appendChild(nameHeader);

        const scoreHeader: HTMLTableCellElement = document.createElement("th");
        scoreHeader.textContent = "Score";
        header.appendChild(scoreHeader);
        this.element.appendChild(header);
    }

    display(): HTMLElement {
        return this.element;
    }
}

//#endregion

//#region Player

export class PlayerDisplay extends Displayable {
    score: number = 0;

    constructor(id: string) {
        super(document.createElement("section"));
        this.element.classList.add("player");
        this.element.id = id;

        const name: HTMLHeadingElement = document.createElement("h2");
        name.textContent = id;
        this.element.appendChild(name);

        const score: HTMLHeadingElement = document.createElement("h3");
        score.classList.add("score");
        score.textContent = this.score.toString();
        this.element.appendChild(score);

        const diceSection: HTMLDivElement = document.createElement("div");
        diceSection.classList.add("dice");
        this.element.appendChild(diceSection);
    }

    update(score: number): void {
        this.score = score;
    }

    display(): HTMLElement {
        this.element.querySelector(".score")!.textContent = `Score: ${this.score}`;
        return this.element;
    }
}

//#endregion