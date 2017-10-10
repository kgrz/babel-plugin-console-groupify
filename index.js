const t = require('babel-types');

let stack = 0;
let gotReturn = 0;

const ConsoleLogCheckerVisitor = {
	Identifier: function (path, args) {
		const name = path.node.name;

		if (name === 'console') {
			if (stack === 0) {
				stack++;
			}
		}

		if (name === 'log') {
			if (stack === 1) {
				stack++;

				if (stack === 2) {
					path.stop();
				}
			}
		}
	},
	ReturnStatement: function (path, args) {
		path.insertBefore(
			generateGroupEnd()
		);
		gotReturn++;
	}
}

const generateGroupStart = () =>
	t.expressionStatement(
		t.callExpression(
			t.memberExpression(t.identifier('console'), t.identifier('group')),
			[ t.stringLiteral('methodName') ]
		)
	);


const generateGroupEnd = () =>
	t.expressionStatement(
		t.callExpression(
			t.memberExpression(t.identifier('console'), t.identifier('groupEnd')),
			[]
		)
	);

function ConsoleGroupify (babel) {
	return {
		visitor: {
			BlockStatement: function (path) {
				path.traverse(ConsoleLogCheckerVisitor, { stack: stack, gotReturn });
				if (stack === 2) {
					path.unshiftContainer('body', generateGroupStart());

					if (gotReturn === 0) {
						path.pushContainer('body', generateGroupEnd());
					}
				}
				stack = 0;
				gotReturn = 0;
			}
		}
	}

}

module.exports = ConsoleGroupify;
