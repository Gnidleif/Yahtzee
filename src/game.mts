import {
    Die,
    Rule,
}
from './composite.mjs';
import {
    DieLogic,
    NumberOfLogic,
    OfAKindLogic,
    StraightLogic,
    FullHouseLogic,
    ChanceLogic,
    YahtzeeLogic,
    BonusLogic,
}
from './logic.mjs';

abstract class GameObject {
    protected htmlElement: HTMLElement;

    constructor(element: HTMLElement) {
        this.htmlElement = element;
        this.hide();
    }

    hide(): void {
        this.htmlElement.style.display = "none";
    }

    show(displayType: string = "block"): void {
        this.htmlElement.style.display = displayType;
    }

    abstract update(): void;
    abstract display(): void;
}

class ScoreCard extends GameObject {
    private rules: Rule[] = [
        new Rule(new NumberOfLogic(1)),
        new Rule(new NumberOfLogic(2)),
        new Rule(new NumberOfLogic(3)),
        new Rule(new NumberOfLogic(4)),
        new Rule(new NumberOfLogic(5)),
        new Rule(new NumberOfLogic(6)),
        new Rule(new OfAKindLogic(3)),
        new Rule(new OfAKindLogic(4)),
        new Rule(new StraightLogic(4)),
        new Rule(new StraightLogic(5)),
        new Rule(new FullHouseLogic()),
        new Rule(new ChanceLogic()),
        new Rule(new YahtzeeLogic()),
    ];

    constructor(element: HTMLElement) {
        const table: HTMLTableElement = document.createElement("table");
        element.appendChild(table);
        super(table);
        
        const header: HTMLTableRowElement = document.createElement("tr");
        const nameCell: HTMLTableCellElement = document.createElement("td");
        nameCell.textContent = "Name";
        header.appendChild(nameCell);

        const scoreCell: HTMLTableCellElement = document.createElement("td");
        scoreCell.textContent = "Score";
        header.appendChild(scoreCell);

        this.htmlElement.appendChild(header);
    }

    get score(): number {
        return this.rules
            .filter(rule => rule.isFrozen)
            .reduce((acc, cur) => acc + cur.score, 0);
    }

    override update(...diceValues: number[]): void {
        this.rules.forEach(rule => rule.update(...diceValues));
    }

    override display(): void {
        this.show();
        this.htmlElement.querySelectorAll(".rule").forEach(rule => rule.remove());
        this.htmlElement.append(...this.rules.map(rule => rule.display()));
    }
}

class Dice extends GameObject {
    private dice: Die[];

    constructor(element: HTMLElement, dieCount: number = 5, sides: number = 6) {
        super(element);
        this.dice = Array.from({ length: dieCount }, 
            () => new Die(new DieLogic(sides)));
    }

    get values(): number[] {
        return this.dice.map(die => die.currentValue);
    }

    override update(): void {
        this.dice.forEach(die => die.roll());
    }

    override display(): void {
        this.show("flex");
        this.htmlElement.replaceChildren(...this.dice.map(die => die.display()));
    }
}

class Player extends GameObject {
    private name: string;
    private score: number = 0;
    private scoreCard: ScoreCard;

    constructor(element: HTMLElement, name: string) {
        super(element);
        this.name = name;
        this.scoreCard = new ScoreCard(element.querySelector("#score-card")!);
    }

    override update(...diceValues: number[]): void {
        this.scoreCard.update(...diceValues);
        this.score = this.scoreCard.score;
    }

    override display(): void {
        this.htmlElement.querySelector("#player-name")!
            .textContent = this.name;
        this.htmlElement.querySelector("#player-score")!
            .textContent = `Score: ${this.score}`;
        this.scoreCard.show();
        this.scoreCard.display();
    }
}

export class Start extends GameObject {
    override update(): void {
        throw new Error('Method not implemented.');
    }
    override display(): void {
        this.show();
    }
}

export class Game extends GameObject {
    private players: Player[];
    private dice: Dice;
    private currentIndex: number = 0;

    constructor(element: HTMLElement, playerNames: string[]) {
        super(element);
        this.players = playerNames
            .map(name => new Player(element, name));
        this.dice = new Dice(element.querySelector(".dice")!);
    }

    get currentPlayer(): Player {
        return this.players[this.currentIndex];
    }

    override update(): void {
        this.dice.update();
        this.currentPlayer.update(...this.dice.values);
    }

    override display(): void {
        this.dice.display();
        this.currentPlayer.display();
    }
}

export class End extends GameObject {
    override update(): void {
        throw new Error('Method not implemented.');
    }
    override display(): void {
        throw new Error('Method not implemented.');
    }
}