import * as logic from "./logic.mjs";

export class Test {
    private name: string = "";
    private args: any[] = [];
    private testFunc: Function = () => {};
    private assertFunc: Function = () => {};

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
    private verbose: boolean = false;
    private tests: Test[] = [];

    constructor(verbose: boolean = false) {
        this.verbose = verbose;
    }

    get testCount(): number {
        return this.tests.length;
    }

    add(test: Test): void {
        this.tests.push(test);
    }

    run(): void {
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

export function RunTests(testHandler: TestHandler): void {
    const testName = testHandler.constructor.name;
    console.info(`Running tests on ${testName}`);
    const start: number = performance.now();
    testHandler.run();
    const after: number = performance.now();
    const time: string = (after - start).toFixed(2);
    console.info(`${testName} ran ${testHandler.testCount} in ${time}ms`);
}

export class RuleTests extends TestHandler {
    constructor() {
        super();
        this.add(new Test("NumberOfLogic constructor",
            () => new logic.NumberOfLogic(6), 
            (x: logic.ILogic) => TestHandler.assertType(logic.NumberOfLogic, x)));
        this.add(new Test("NumberOfLogic calculate",
            () => new logic.NumberOfLogic(6).calculate(1, 2, 3, 4, 5, 6),
            (x: number) => TestHandler.assertEquals(6, x)));
        this.add(new Test("NumberOfLogic name",
            () => new logic.NumberOfLogic(6).ruleName,
            (x: string) => TestHandler.assertEquals("NumberOf", x)));
    }
}