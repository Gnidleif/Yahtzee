//#region Base
export class Displayable {
    element;
    constructor(element) {
        this.element = element;
    }
    get htmlElement() {
        return this.element;
    }
}
//#endregion
//#region Die
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
    }
    display() {
        this.element.querySelectorAll(".dot")?.forEach(dot => dot.remove());
        this.dots.forEach(dot => this.element.appendChild(dot));
        return this.element;
    }
}
//#endregion
//#region Rule
export class RuleDisplay extends Displayable {
    id;
    scoreText = "";
    constructor(id) {
        super(document.createElement("tr"));
        this.id = id;
        this.element.classList.add("rule");
        this.element.id = this.id;
        const nameCell = document.createElement("td");
        nameCell.textContent = this.id;
        this.element.appendChild(nameCell);
        const scoreCell = document.createElement("td");
        scoreCell.classList.add("score");
        scoreCell.textContent = this.scoreText;
        this.element.appendChild(scoreCell);
    }
    update(score) {
        if (score < 0) {
            throw new RangeError("Score must be greater than or equal to 0");
        }
        this.scoreText = score.toString();
    }
    display() {
        this.element.querySelector(".score").textContent = this.scoreText;
        return this.element;
    }
}
//#endregion
//#region ScoreCard
export class ScoreCardDisplay extends Displayable {
    constructor() {
        super(document.createElement("table"));
        this.element.classList.add("score-card");
        const header = document.createElement("tr");
        const nameHeader = document.createElement("th");
        nameHeader.textContent = "Name";
        header.appendChild(nameHeader);
        const scoreHeader = document.createElement("th");
        scoreHeader.textContent = "Score";
        header.appendChild(scoreHeader);
        this.element.appendChild(header);
    }
    display() {
        return this.element;
    }
}
//#endregion
//#region Player
export class PlayerDisplay extends Displayable {
    score = 0;
    constructor(id) {
        super(document.createElement("section"));
        this.element.classList.add("player");
        this.element.id = id;
        const name = document.createElement("h2");
        name.textContent = id;
        this.element.appendChild(name);
        const score = document.createElement("h3");
        score.classList.add("score");
        score.textContent = this.score.toString();
        this.element.appendChild(score);
        const diceSection = document.createElement("div");
        diceSection.classList.add("dice");
        this.element.appendChild(diceSection);
    }
    update(score) {
        this.score = score;
    }
    display() {
        this.element.querySelector(".score").textContent = `Score: ${this.score}`;
        return this.element;
    }
}
//#endregion
