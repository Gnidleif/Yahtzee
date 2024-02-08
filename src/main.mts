import * as testing from "./testing.mjs";

const tests: testing.TestHandler[] = [
    new testing.RuleTests(),
];

tests.forEach(testing.RunTests);