import * as logic from "./logic.mjs";
export class Test {
    name = "";
    args = [];
    testFunc = () => { };
    assertFunc = () => { };
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
    verbose = false;
    tests = [];
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    get testCount() {
        return this.tests.length;
    }
    add(test) {
        this.tests.push(test);
    }
    run() {
        this.tests.forEach((test) => {
            const [name, assertResult] = test.run();
            if (assertResult instanceof Error) {
                console.error(`Test ${name} failed!`);
                console.error(assertResult);
            }
            else if (this.verbose) {
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
export function RunTests(testHandler) {
    const testName = testHandler.constructor.name;
    console.info(`Running tests on ${testName}`);
    const start = performance.now();
    testHandler.run();
    const after = performance.now();
    const time = (after - start).toFixed(2);
    console.info(`${testName} ran ${testHandler.testCount} in ${time}ms`);
}
export class RuleTests extends TestHandler {
    constructor() {
        super();
        this.add(new Test("NumberOfLogic constructor", () => new logic.NumberOfLogic(6), (x) => TestHandler.assertType(logic.NumberOfLogic, x)));
        this.add(new Test("NumberOfLogic calculate", () => new logic.NumberOfLogic(6).calculate(1, 2, 3, 4, 5, 6), (x) => TestHandler.assertEquals(6, x)));
        this.add(new Test("NumberOfLogic name", () => new logic.NumberOfLogic(6).ruleName, (x) => TestHandler.assertEquals("NumberOf", x)));
    }
}
