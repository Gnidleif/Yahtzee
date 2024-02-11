import * as l from "./logic.mjs";
import * as d from "./display.mjs";
import * as c from "./composite.mjs";
class Test {
    name;
    args;
    testFunc;
    assertFunc;
    constructor(name, testFunc, assertFunc, ...args) {
        this.name = name;
        this.testFunc = testFunc;
        this.assertFunc = assertFunc;
        this.args = args;
    }
    run() {
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
    tests = [];
    get testCount() {
        return this.tests.length;
    }
    add(test) {
        this.tests.push(test);
    }
    run(verbose) {
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
    static assertTrue(value) {
        return !value ? new Error("Assertion failed") : true;
    }
    static assertFalse(value) {
        return value ? new Error("Assertion failed") : true;
    }
    static assertEquals(expected, actual) {
        return expected !== actual ? new Error(`Expected ${expected}, but got ${actual}`) : true;
    }
    static assertNotEquals(expected, actual) {
        return expected === actual ? new Error(`Expected ${expected} to not equal ${actual}`) : true;
    }
    static assertType(expected, actual) {
        return !(actual instanceof expected) ? new Error(`Expected ${expected}, but got ${typeof actual}`) : true;
    }
}
export function RunTests(testHandler, verbose) {
    const testName = testHandler.constructor.name;
    console.info(`Running tests on ${testName}`);
    const start = performance.now();
    testHandler.run(verbose);
    const after = performance.now();
    const time = (after - start).toFixed(2);
    console.info(`${testName} ran ${testHandler.testCount} tests in ${time}ms`);
}
export const dieTests = new class DieTests extends TestHandler {
};
// Logic tests
dieTests.add(new Test("DieLogic constructor", () => new l.DieLogic(6), (x) => TestHandler.assertType(l.DieLogic, x)));
dieTests.add(new Test("DieLogic calculate", () => new l.DieLogic(6).calculate(), (x) => TestHandler.assertTrue(x >= 1 && x <= 6)));
dieTests.add(new Test("DieLogic roll", (x) => { x.roll(); return x.currentValue; }, (x) => TestHandler.assertTrue(x >= 1 && x <= 6), new l.DieLogic(6)));
dieTests.add(new Test("DieLogic roll frozen", (x) => { x.freeze(); x.roll(); return x.currentValue; }, (x) => TestHandler.assertTrue(x === 0), new l.DieLogic(6)));
dieTests.add(new Test("DieLogic roll unfrozen", (x) => { x.freeze(); x.unfreeze(); x.roll(); return x.currentValue; }, (x) => TestHandler.assertTrue(x >= 1 && x <= 6), new l.DieLogic(6)));
// Display tests
dieTests.add(new Test("DieDisplay constructor", () => new d.DieDisplay(), (x) => TestHandler.assertType(d.DieDisplay, x)));
dieTests.add(new Test("DieDisplay display", (x) => x.htmlElement, (x) => TestHandler.assertType(HTMLElement, x), new d.DieDisplay()));
dieTests.add(new Test("DieDisplay update", (x) => { x.update(6); return x.dotsCount; }, (x) => TestHandler.assertEquals(6, x), new d.DieDisplay()));
dieTests.add(new Test("DieDisplay out of range (low)", (x) => x.update(0), (x) => TestHandler.assertType(RangeError, x), new d.DieDisplay()));
dieTests.add(new Test("DieDisplay out of range (high)", (x) => x.update(7), (x) => TestHandler.assertType(RangeError, x), new d.DieDisplay()));
// Composite tests
dieTests.add(new Test("Die constructor", () => new c.Die(), (x) => TestHandler.assertType(c.Die, x)));
dieTests.add(new Test("Die roll", (x) => { x.roll(); return x; }, (x) => TestHandler.assertTrue(x.display().querySelectorAll(".dot").length > 0), new c.Die()));
dieTests.add(new Test("Die freeze", (x) => { x.display().click(); return x.display().classList.contains("frozen"); }, (x) => TestHandler.assertTrue(x), new c.Die()));
dieTests.add(new Test("Die unfreeze", (x) => { x.display().click(); x.display().click(); return x.display().classList.contains("frozen"); }, (x) => TestHandler.assertFalse(x), new c.Die()));
export const ruleTests = new class RuleTests extends TestHandler {
};
// Logic tests
ruleTests.add(new Test("NumberOfLogic constructor", () => new l.NumberOfLogic(6), (x) => TestHandler.assertType(l.NumberOfLogic, x)));
ruleTests.add(new Test("NumberOfLogic calculate", () => new l.NumberOfLogic(6).calculate(1, 2, 3, 4, 5, 6), (x) => TestHandler.assertTrue(x === 6)));
ruleTests.add(new Test("NumberOfLogic update", (x) => { x.update(1, 2, 3, 4, 5, 6); return x.score; }, (x) => TestHandler.assertTrue(x === 6), new l.NumberOfLogic(6)));
ruleTests.add(new Test("NumberOfLogic update frozen", (x) => { x.freeze(); x.update(1, 2, 3, 4, 5, 6); return x.score; }, (x) => TestHandler.assertTrue(x === 0), new l.NumberOfLogic(6)));
ruleTests.add(new Test("NumberOfLogic name", (n) => n.ruleName, (x) => TestHandler.assertEquals("NumberOf6", x), new l.NumberOfLogic(6)));
ruleTests.add(new Test("OfAKindLogic constructor", () => new l.OfAKindLogic(3), (x) => TestHandler.assertType(l.OfAKindLogic, x)));
ruleTests.add(new Test("OfAKindLogic calculate", () => new l.OfAKindLogic(3).calculate(1, 1, 1, 2, 2), (x) => TestHandler.assertTrue(x === 3)));
ruleTests.add(new Test("OfAKindLogic update", (o) => { o.update(1, 1, 1, 2, 2); return o.score; }, (x) => TestHandler.assertTrue(x === 3), new l.OfAKindLogic(3)));
ruleTests.add(new Test("OfAKindLogic update frozen", (o) => { o.freeze(); o.update(1, 1, 1, 2, 2); return o.score; }, (x) => TestHandler.assertTrue(x === 0), new l.OfAKindLogic(3)));
ruleTests.add(new Test("OfAKindLogic name", (o) => o.ruleName, (x) => TestHandler.assertEquals("OfAKind3", x), new l.OfAKindLogic(3)));
ruleTests.add(new Test("StraightLogic constructor", () => new l.StraightLogic(4), (x) => TestHandler.assertType(l.StraightLogic, x)));
ruleTests.add(new Test("StraightLogic(4) calculate", () => new l.StraightLogic(4).calculate(1, 2, 3, 4, 5), (x) => TestHandler.assertTrue(x === 40)));
ruleTests.add(new Test("StraightLogic(4) update", (s) => { s.update(1, 2, 3, 4, 5); return s.score; }, (x) => TestHandler.assertTrue(x === 40), new l.StraightLogic(4)));
ruleTests.add(new Test("StraightLogic(4) update frozen", (s) => { s.freeze(); s.update(1, 2, 3, 4, 5); return s.score; }, (x) => TestHandler.assertTrue(x === 0), new l.StraightLogic(4)));
ruleTests.add(new Test("StraightLogic(4) name", (s) => s.ruleName, (x) => TestHandler.assertEquals("Straight4", x), new l.StraightLogic(4)));
ruleTests.add(new Test("StraightLogic(5) calculate", () => new l.StraightLogic(5).calculate(1, 2, 3, 4, 5), (x) => TestHandler.assertTrue(x === 50), new l.StraightLogic(5)));
ruleTests.add(new Test("StraightLogic(5) update", (s) => { s.update(1, 2, 3, 4, 5); return s.score; }, (x) => TestHandler.assertTrue(x === 50), new l.StraightLogic(5)));
ruleTests.add(new Test("FullHouseLogic constructor", () => new l.FullHouseLogic(), (x) => TestHandler.assertType(l.FullHouseLogic, x)));
ruleTests.add(new Test("FullHouseLogic calculate", () => new l.FullHouseLogic().calculate(1, 1, 2, 2, 2), (x) => TestHandler.assertTrue(x === 50)));
ruleTests.add(new Test("FullHouseLogic update", (f) => { f.update(1, 1, 2, 2, 2); return f.score; }, (x) => TestHandler.assertTrue(x === 50), new l.FullHouseLogic()));
ruleTests.add(new Test("FullHouseLogic update frozen", (f) => { f.freeze(); f.update(1, 1, 2, 2, 2); return f.score; }, (x) => TestHandler.assertTrue(x === 0), new l.FullHouseLogic()));
ruleTests.add(new Test("FullHouseLogic name", (f) => f.ruleName, (x) => TestHandler.assertEquals("FullHouse", x), new l.FullHouseLogic()));
ruleTests.add(new Test("ChanceLogic constructor", () => new l.ChanceLogic(), (x) => TestHandler.assertType(l.ChanceLogic, x)));
ruleTests.add(new Test("ChanceLogic calculate", () => new l.ChanceLogic().calculate(1, 2, 3, 4, 5), (x) => TestHandler.assertTrue(x === 15)));
ruleTests.add(new Test("ChanceLogic update", (c) => { c.update(1, 2, 3, 4, 5); return c.score; }, (x) => TestHandler.assertTrue(x === 15), new l.ChanceLogic()));
ruleTests.add(new Test("ChanceLogic update frozen", (c) => { c.freeze(); c.update(1, 2, 3, 4, 5); return c.score; }, (x) => TestHandler.assertTrue(x === 0), new l.ChanceLogic()));
ruleTests.add(new Test("ChanceLogic name", (c) => c.ruleName, (x) => TestHandler.assertEquals("Chance", x), new l.ChanceLogic()));
ruleTests.add(new Test("YahtzeeLogic constructor", () => new l.YahtzeeLogic(), (x) => TestHandler.assertType(l.YahtzeeLogic, x)));
ruleTests.add(new Test("YahtzeeLogic calculate", () => new l.YahtzeeLogic().calculate(1, 1, 1, 1, 1), (x) => TestHandler.assertTrue(x === 100)));
ruleTests.add(new Test("YahtzeeLogic update", (y) => { y.update(1, 1, 1, 1, 1); return y.score; }, (x) => TestHandler.assertTrue(x === 100), new l.YahtzeeLogic()));
ruleTests.add(new Test("YahtzeeLogic update frozen", (y) => { y.freeze(); y.update(1, 1, 1, 1, 1); return y.score; }, (x) => TestHandler.assertTrue(x === 0), new l.YahtzeeLogic()));
ruleTests.add(new Test("YahtzeeLogic name", (y) => y.ruleName, (x) => TestHandler.assertEquals("Yahtzee", x), new l.YahtzeeLogic()));
ruleTests.add(new Test("BonusLogic constructor", () => new l.BonusLogic(20), (x) => TestHandler.assertType(l.BonusLogic, x)));
ruleTests.add(new Test("BonusLogic calculate", () => new l.BonusLogic(20).calculate(5, 5, 5, 5, 5), (x) => TestHandler.assertTrue(x === 25)));
ruleTests.add(new Test("BonusLogic calculate (fail)", () => new l.BonusLogic(20).calculate(1, 1, 1, 1, 1), (x) => TestHandler.assertTrue(x === 0)));
ruleTests.add(new Test("BonusLogic update", (b) => { b.update(5, 5, 5, 5, 5); return b.score; }, (x) => TestHandler.assertTrue(x === 25), new l.BonusLogic(20)));
ruleTests.add(new Test("BonusLogic update frozen", (b) => { b.freeze(); b.update(5, 5, 5, 5, 5); return b.score; }, (x) => TestHandler.assertTrue(x === 0), new l.BonusLogic(20)));
ruleTests.add(new Test("BonusLogic name", (b) => b.ruleName, (x) => TestHandler.assertEquals("Bonus20", x), new l.BonusLogic(20)));
// Display tests
ruleTests.add(new Test("RuleDisplay constructor", () => new d.RuleDisplay("test"), (x) => TestHandler.assertType(d.RuleDisplay, x)));
ruleTests.add(new Test("RuleDisplay display", (r) => r.htmlElement, (x) => TestHandler.assertType(HTMLElement, x), new d.RuleDisplay("test")));
ruleTests.add(new Test("RuleDisplay update", (r) => { r.update(50); return r.htmlElement.children[1]; }, (x) => TestHandler.assertEquals("50", x.textContent), new d.RuleDisplay("test")));
ruleTests.add(new Test("RuleDisplay out of range", (r) => r.update(-1), (x) => TestHandler.assertType(RangeError, x), new d.RuleDisplay("test")));
// Composite tests
ruleTests.add(new Test("Rule constructor", () => new c.Rule(new l.NumberOfLogic(6)), (x) => TestHandler.assertType(c.Rule, x)));
ruleTests.add(new Test("Rule check", (r) => { r.update(1, 2, 3, 4, 5, 6); return r.display(); }, (e) => TestHandler.assertTrue(e.children[1].textContent === "6"), new c.Rule(new l.NumberOfLogic(6))));
