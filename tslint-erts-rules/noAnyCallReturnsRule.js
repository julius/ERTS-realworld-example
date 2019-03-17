"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Lint = require("tslint");
var ts = require("typescript");
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    //     return this.applyWithWalker(new Walk(sourceFile, this.getOptions()));
    // }
    Rule.prototype.applyWithProgram = function (sourceFile, program) {
        return this.applyWithWalker(new Walker(sourceFile, this.ruleName, this.ruleArguments, program.getTypeChecker()));
    };
    /* tslint:disable:object-literal-sort-keys */
    Rule.metadata = {
        ruleName: "no-any-call-returns",
        description: "Function calls that return any are not allowed.",
        options: {},
        optionsDescription: "Nothin",
        type: "typescript",
        hasFix: false,
        typescriptOnly: true,
        requiresTypeInfo: true,
    };
    /* tslint:enable:object-literal-sort-keys */
    Rule.FAILURE_STRING = 'Function calls that return any are not allowed.';
    return Rule;
}(Lint.Rules.TypedRule));
exports.Rule = Rule;
var Walker = /** @class */ (function (_super) {
    __extends(Walker, _super);
    function Walker(sourceFile, ruleName, options, checker) {
        var _this = _super.call(this, sourceFile, ruleName, options) || this;
        _this.checker = checker;
        return _this;
    }
    Walker.prototype.walk = function (sourceFile) {
        var _this = this;
        var cb = function (node) {
            switch (node.kind) {
                case ts.SyntaxKind.CallExpression:
                    _this.checkCallExpression(node);
            }
            return ts.forEachChild(node, cb);
        };
        return ts.forEachChild(sourceFile, cb);
    };
    Walker.prototype.checkCallExpression = function (node) {
        var callSig = this.checker.getResolvedSignature(node);
        if (callSig === undefined) {
            return;
        }
        var retType = this.checker.getReturnTypeOfSignature(callSig);
        if (retType.flags === ts.TypeFlags.Any)
            this.addFailureAtNode(node, Rule.FAILURE_STRING);
    };
    return Walker;
}(Lint.AbstractWalker));
//# sourceMappingURL=noAnyCallReturnsRule.js.map