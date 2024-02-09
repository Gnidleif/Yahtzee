import * as l from "./logic.mjs";
import * as d from "./display.mjs";
import * as c from "./composite.mjs";

//#region Test framework

class Test {
    private name: string;
    private args: any[];
    private testFunc: Function;
    private assertFunc: Function;

    constructor(name: string, testFunc: Function, assertFunc: Function, ...args: any[]) {
        this.name = name;
        this.testFunc = testFunc;
        this.assertFunc = assertFunc;
        this.args = args;
    }

    run(): [string, any] {
        let result = null;
        try {
            if (this.args.length > 0) {
                result = this.testFunc(...this.args);
            }
            else {
                result = this.testFunc();
            }
        }
        catch (e) {
            result = e;
        }

        return [this.name, this.assertFunc(result)];
    }
}

export class TestHandler {
    private tests: Test[] = [];

    get testCount(): number {
        return this.tests.length;
    }

    add(test: Test): void {
        this.tests.push(test);
    }

    run(verbose: boolean): void {
        if (!this.tests.length) {
            console.warn(`${this.constructor.name} has no tests to run`);
            return;
        }
        this.tests.forEach((test) => {
            const [name, result] = test.run();
            if (result instanceof Error) {
                console.error(`Test ${name} failed!`);
                console.error(result);
            }
            else if (verbose) {
                console.info(`Test ${name} passed!`);
            }
        });
    }

    static assertTrue(value: any): boolean | Error {
        return !value ? new Error("Assertion failed") : true;
    }

    static assertFalse(value: any): boolean | Error {
        return value ? new Error("Assertion failed") : true;
    }

    static assertEquals(expected: any, actual: any): boolean | Error {
        return expected !== actual ? new Error(`Expected ${expected}, but got ${actual}`) : true;
    }

    static assertNotEquals(expected: any, actual: any): boolean | Error {
        return expected === actual ? new Error(`Expected ${expected} to not equal ${actual}`) : true;
    }

    static assertType(expected: any, actual: any): boolean | Error {
        return !(actual instanceof expected) ? new Error(`Expected ${expected}, but got ${typeof actual}`) : true;
    }
}

export function RunTests(testHandler: TestHandler, verbose: boolean): void {
    const testName = testHandler.constructor.name;
    console.info(`Running tests on ${testName}`);
    const start: number = performance.now();
    testHandler.run(verbose);
    const after: number = performance.now();
    const time: string = (after - start).toFixed(2);
    console.info(`${testName} ran ${testHandler.testCount} tests in ${time}ms`);
}

//#endregion

//#region Die tests

export const dieTests = new class DieTests extends TestHandler {};

// Logic tests
dieTests.add(new Test("DieLogic constructor",
    () => new l.DieLogic(6),
    (x: l.ILogic) => TestHandler.assertType(l.DieLogic, x)));
dieTests.add(new Test("DieLogic calculate",
    () => new l.DieLogic(6).calculate(),
    (x: number) => TestHandler.assertTrue(x >= 1 && x <= 6)));
dieTests.add(new Test("DieLogic roll",
    (d: l.DieLogic) => { d.roll(); return d.currentValue; },
    (x: number) => TestHandler.assertTrue(x >= 1 && x <= 6),
    new l.DieLogic(6)));
dieTests.add(new Test("DieLogic roll frozen",
    (d: l.DieLogic) => { d.freeze(); d.roll(); return d.currentValue; },
    (x: number) => TestHandler.assertTrue(x === 0),
    new l.DieLogic(6)));
dieTests.add(new Test("DieLogic roll unfrozen",
    (d: l.DieLogic) => { d.freeze(); d.unfreeze(); d.roll(); return d.currentValue; },
    (x: number) => TestHandler.assertTrue(x >= 1 && x <= 6),
    new l.DieLogic(6)));

// Display tests
dieTests.add(new Test("DieDisplay constructor",
    () => new d.DieDisplay(),
    (x: d.IDisplay) => TestHandler.assertType(d.DieDisplay, x)));
dieTests.add(new Test("DieDisplay display",
    (d: d.DieDisplay) => d.display(),
    (x: HTMLElement) => TestHandler.assertType(HTMLElement, x),
    new d.DieDisplay()));
dieTests.add(new Test("DieDisplay update",
    (d: d.DieDisplay) => { d.update(6); return d.dotsCount; },
    (x: number) => TestHandler.assertEquals(6, x),
    new d.DieDisplay()));
dieTests.add(new Test("DieDisplay out of range (low)",
    (d: d.DieDisplay) => d.update(0),
    (x: Error) => TestHandler.assertType(RangeError, x),
    new d.DieDisplay()));
dieTests.add(new Test("DieDisplay out of range (high)",
    (d: d.DieDisplay) => d.update(7),
    (x: Error) => TestHandler.assertType(RangeError, x),
    new d.DieDisplay()));

// Composite tests
dieTests.add(new Test("Die constructor",
    () => new c.Die(),
    (x: c.Composite) => TestHandler.assertType(c.Die, x)));
dieTests.add(new Test("Die roll",
    (d: c.Die) => { d.roll(); return d; },
    (d: c.Die) => TestHandler.assertTrue(d.display().querySelectorAll(".dot").length > 0),
    new c.Die()));
dieTests.add(new Test("Die freeze",
    (d: c.Die) => { d.display().click(); return d.display().classList.contains("frozen"); },
    (x: boolean) => TestHandler.assertTrue(x),
    new c.Die()));
dieTests.add(new Test("Die unfreeze",
    (d: c.Die) => { d.display().click(); d.display().click(); return d.display().classList.contains("frozen"); },
    (x: boolean) => TestHandler.assertFalse(x),
    new c.Die()));

//#endregion

//#region Rule tests

export const ruleTests = new class RuleTests extends TestHandler {};

// Logic tests
ruleTests.add(new Test("NumberOfLogic constructor",
    () => new l.NumberOfLogic(6),
    (x: l.ILogic) => TestHandler.assertType(l.NumberOfLogic, x)));
ruleTests.add(new Test("NumberOfLogic calculate",
    () => new l.NumberOfLogic(6).calculate(1, 2, 3, 4, 5, 6),
    (x: number) => TestHandler.assertTrue(x === 6)));
ruleTests.add(new Test("NumberOfLogic update",
    (n: l.NumberOfLogic) => { n.update(1, 2, 3, 4, 5, 6); return n.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 6),
    new l.NumberOfLogic(6)));
ruleTests.add(new Test("NumberOfLogic update frozen",
    (n: l.NumberOfLogic) => { n.freeze(); n.update(1, 2, 3, 4, 5, 6); return n.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 0),
    new l.NumberOfLogic(6)));
ruleTests.add(new Test("NumberOfLogic name",
    (n: l.NumberOfLogic) => n.ruleName,
    (x: string) => TestHandler.assertEquals("NumberOf", x),
    new l.NumberOfLogic(6)));

ruleTests.add(new Test("OfAKindLogic constructor",
    () => new l.OfAKindLogic(3),
    (x: l.ILogic) => TestHandler.assertType(l.OfAKindLogic, x)));
ruleTests.add(new Test("OfAKindLogic calculate",
    () => new l.OfAKindLogic(3).calculate(1, 1, 1, 2, 2),
    (x: number) => TestHandler.assertTrue(x === 3)));
ruleTests.add(new Test("OfAKindLogic update",
    (o: l.OfAKindLogic) => { o.update(1, 1, 1, 2, 2); return o.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 3),
    new l.OfAKindLogic(3)));
ruleTests.add(new Test("OfAKindLogic update frozen",
    (o: l.OfAKindLogic) => { o.freeze(); o.update(1, 1, 1, 2, 2); return o.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 0),
    new l.OfAKindLogic(3)));
ruleTests.add(new Test("OfAKindLogic name",
    (o: l.OfAKindLogic) => o.ruleName,
    (x: string) => TestHandler.assertEquals("OfAKind3", x),
    new l.OfAKindLogic(3)));

ruleTests.add(new Test("StraightLogic constructor",
    () => new l.StraightLogic(4),
    (x: l.ILogic) => TestHandler.assertType(l.StraightLogic, x)));
ruleTests.add(new Test("StraightLogic(4) calculate",
    () => new l.StraightLogic(4).calculate(1, 2, 3, 4, 5),
    (x: number) => TestHandler.assertTrue(x === 40)));
ruleTests.add(new Test("StraightLogic(4) update",
    (s: l.StraightLogic) => { s.update(1, 2, 3, 4, 5); return s.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 40),
    new l.StraightLogic(4)));
ruleTests.add(new Test("StraightLogic(4) update frozen",
    (s: l.StraightLogic) => { s.freeze(); s.update(1, 2, 3, 4, 5); return s.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 0),
    new l.StraightLogic(4)));
ruleTests.add(new Test("StraightLogic(4) name",
    (s: l.StraightLogic) => s.ruleName,
    (x: string) => TestHandler.assertEquals("Straight4", x),
    new l.StraightLogic(4)));
ruleTests.add(new Test("StraightLogic(5) calculate",
    () => new l.StraightLogic(5).calculate(1, 2, 3, 4, 5),
    (x: number) => TestHandler.assertTrue(x === 50),
    new l.StraightLogic(5)));
ruleTests.add(new Test("StraightLogic(5) update",
    (s: l.StraightLogic) => { s.update(1, 2, 3, 4, 5); return s.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 50),
    new l.StraightLogic(5)));

ruleTests.add(new Test("FullHouseLogic constructor",
    () => new l.FullHouseLogic(),
    (x: l.ILogic) => TestHandler.assertType(l.FullHouseLogic, x)));
ruleTests.add(new Test("FullHouseLogic calculate",
    () => new l.FullHouseLogic().calculate(1, 1, 2, 2, 2),
    (x: number) => TestHandler.assertTrue(x === 50)));
ruleTests.add(new Test("FullHouseLogic update",
    (f: l.FullHouseLogic) => { f.update(1, 1, 2, 2, 2); return f.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 50),
    new l.FullHouseLogic()));
ruleTests.add(new Test("FullHouseLogic update frozen",
    (f: l.FullHouseLogic) => { f.freeze(); f.update(1, 1, 2, 2, 2); return f.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 0),
    new l.FullHouseLogic()));
ruleTests.add(new Test("FullHouseLogic name",
    (f: l.FullHouseLogic) => f.ruleName,
    (x: string) => TestHandler.assertEquals("FullHouse", x),
    new l.FullHouseLogic()));

ruleTests.add(new Test("ChanceLogic constructor",
    () => new l.ChanceLogic(),
    (x: l.ILogic) => TestHandler.assertType(l.ChanceLogic, x)));
ruleTests.add(new Test("ChanceLogic calculate",
    () => new l.ChanceLogic().calculate(1, 2, 3, 4, 5),
    (x: number) => TestHandler.assertTrue(x === 15)));
ruleTests.add(new Test("ChanceLogic update",
    (c: l.ChanceLogic) => { c.update(1, 2, 3, 4, 5); return c.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 15),
    new l.ChanceLogic()));
ruleTests.add(new Test("ChanceLogic update frozen",
    (c: l.ChanceLogic) => { c.freeze(); c.update(1, 2, 3, 4, 5); return c.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 0),
    new l.ChanceLogic()));
ruleTests.add(new Test("ChanceLogic name",
    (c: l.ChanceLogic) => c.ruleName,
    (x: string) => TestHandler.assertEquals("Chance", x),
    new l.ChanceLogic()));

ruleTests.add(new Test("YahtzeeLogic constructor",
    () => new l.YahtzeeLogic(),
    (x: l.ILogic) => TestHandler.assertType(l.YahtzeeLogic, x)));
ruleTests.add(new Test("YahtzeeLogic calculate",
    () => new l.YahtzeeLogic().calculate(1, 1, 1, 1, 1),
    (x: number) => TestHandler.assertTrue(x === 100)));
ruleTests.add(new Test("YahtzeeLogic update",
    (y: l.YahtzeeLogic) => { y.update(1, 1, 1, 1, 1); return y.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 100),
    new l.YahtzeeLogic()));
ruleTests.add(new Test("YahtzeeLogic update frozen",
    (y: l.YahtzeeLogic) => { y.freeze(); y.update(1, 1, 1, 1, 1); return y.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 0),
    new l.YahtzeeLogic()));
ruleTests.add(new Test("YahtzeeLogic name",
    (y: l.YahtzeeLogic) => y.ruleName,
    (x: string) => TestHandler.assertEquals("Yahtzee", x),
    new l.YahtzeeLogic()));

ruleTests.add(new Test("BonusLogic constructor",
    () => new l.BonusLogic(20),
    (x: l.ILogic) => TestHandler.assertType(l.BonusLogic, x)));
ruleTests.add(new Test("BonusLogic calculate",
    () => new l.BonusLogic(20).calculate(5, 5, 5, 5, 5),
    (x: number) => TestHandler.assertTrue(x === 25)));
ruleTests.add(new Test("BonusLogic calculate (fail)",
    () => new l.BonusLogic(20).calculate(1, 1, 1, 1, 1),
    (x: number) => TestHandler.assertTrue(x === 0)));
ruleTests.add(new Test("BonusLogic update",
    (b: l.BonusLogic) => { b.update(5, 5, 5, 5, 5); return b.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 25),
    new l.BonusLogic(20)));
ruleTests.add(new Test("BonusLogic update frozen",
    (b: l.BonusLogic) => { b.freeze(); b.update(5, 5, 5, 5, 5); return b.currentScore; },
    (x: number) => TestHandler.assertTrue(x === 0),
    new l.BonusLogic(20)));
ruleTests.add(new Test("BonusLogic name",
    (b: l.BonusLogic) => b.ruleName,
    (x: string) => TestHandler.assertEquals("Bonus20", x),
    new l.BonusLogic(20)));

// Display tests
ruleTests.add(new Test("RuleDisplay constructor",
    () => new d.RuleDisplay("test"),
    (x: d.IDisplay) => TestHandler.assertType(d.RuleDisplay, x)));
ruleTests.add(new Test("RuleDisplay display",
    (r: d.RuleDisplay) => r.display(),
    (x: HTMLElement) => TestHandler.assertType(HTMLElement, x),
    new d.RuleDisplay("test")));
ruleTests.add(new Test("RuleDisplay update",
    (r: d.RuleDisplay) => { r.update(50); return r.display().querySelector(".score")!; },
    (x: HTMLElement) => TestHandler.assertEquals("50", x.textContent),
    new d.RuleDisplay("test")));
ruleTests.add(new Test("RuleDisplay out of range",
    (r: d.RuleDisplay) => r.update(-1),
    (x: Error) => TestHandler.assertType(RangeError, x),
    new d.RuleDisplay("test")));

// Composite tests
ruleTests.add(new Test("Rule constructor",
    () => new c.Rule(new l.NumberOfLogic(6)),
    (x: c.Composite) => TestHandler.assertType(c.Rule, x)));
ruleTests.add(new Test("Rule check",
    (r: c.Rule) => { r.check(1, 2, 3, 4, 5, 6); return r.display(); },
    (e: HTMLElement) => TestHandler.assertTrue(e.querySelector(".score")!.textContent === "6"),
    new c.Rule(new l.NumberOfLogic(6))));
ruleTests.add(new Test("Rule freeze",
    (r: c.Rule) => { r.htmlElement.click(); return r.htmlElement.classList.contains("frozen"); },
    (x: boolean) => TestHandler.assertTrue(x),
    new c.Rule(new l.NumberOfLogic(6))));
ruleTests.add(new Test("Rule unfreeze",
    (r: c.Rule) => { r.htmlElement.click(); r.htmlElement.click(); return r.htmlElement.classList.contains("frozen"); },
    (x: boolean) => TestHandler.assertFalse(x),
    new c.Rule(new l.NumberOfLogic(6))));

//#endregion