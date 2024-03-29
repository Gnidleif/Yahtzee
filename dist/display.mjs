import { find, } from "./utils.mjs";
export class Displayable {
    element;
    constructor(element) {
        this.element = element;
    }
    find(selector) {
        return find(this.element, selector);
    }
    get htmlElement() {
        return this.element;
    }
}
export class DieDisplay extends Displayable {
    dots = [];
    constructor() {
        super(document.createElement("div"));
        this.element.classList.add("die");
    }
    get dotsCount() {
        return this.dots.length;
    }
    update(dotCount) {
        if (dotCount < 1 || dotCount > 6) {
            throw new RangeError("Dot count must be between 1 and 6");
        }
        this.dots = Array.from({ length: dotCount }, () => {
            const dot = document.createElement("div");
            dot.classList.add("dot");
            return dot;
        });
        this.element.replaceChildren(...this.dots);
    }
}
export class RuleDisplay extends Displayable {
    scoreCell;
    constructor(id) {
        super(document.createElement("tr"));
        this.element.classList.add("rule");
        this.element.id = id;
        const nameCell = document.createElement("td");
        nameCell.textContent = id;
        this.element.appendChild(nameCell);
        this.scoreCell = document.createElement("td");
        this.element.appendChild(this.scoreCell);
    }
    update(score) {
        if (score < 0) {
            throw new RangeError("Score must be greater than or equal to 0");
        }
        this.scoreCell.textContent = score.toString();
    }
}
