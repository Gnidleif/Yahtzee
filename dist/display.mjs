//#region Base classes
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
//#region Die classes
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
//#region Rule classes
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
export class PlayerDisplay extends Displayable {
    name;
    dice = [];
    scoreText = "";
    constructor(name, diceCount = 5) {
        super(document.createElement("section"));
        this.name = name;
        this.element.classList.add("player");
        const nameElement = document.createElement("h2");
        nameElement.textContent = this.name;
        this.element.appendChild(nameElement);
        const scoreElement = document.createElement("h3");
        scoreElement.classList.add("score");
        scoreElement.textContent = this.scoreText;
        this.element.appendChild(scoreElement);
        const diceElement = document.createElement("div");
        diceElement.classList.add("dice");
        this.element.appendChild(diceElement);
        this.dice = Array.from({ length: diceCount }, () => new DieDisplay());
        const rollButton = document.createElement("button");
        rollButton.id = "roll";
        rollButton.textContent = "Roll";
        this.element.appendChild(rollButton);
    }
    update(score, ...dieValues) {
        if (score < 0) {
            throw new RangeError("Score must be greater than or equal to 0");
        }
        this.scoreText = `Score: ${score}`;
        this.dice.forEach((die, index) => die.update(dieValues[index]));
    }
    display() {
        const diceElement = this.element.querySelector(".dice");
        diceElement.querySelectorAll(".die")?.forEach(die => die.remove());
        this.dice.forEach(die => diceElement.appendChild(die.display()));
        this.element.querySelector(".score").textContent = this.scoreText;
        return this.element;
    }
}
