const t = require('babel-types');

let stack = 0;
let gotReturn = 0;
let skipGrouping = 0;

const ConsoleLogCheckerVisitor = {
	BlockStatement: function (path, args) {
		path.stop();
	},
	Identifier: function (path, args) {
		const name = path.node.name;

		if (name === 'console') {
			if (stack === 0) {
				stack++;
			}
		}

		if (name === 'group' || name === 'groupEnd') {
			skipGrouping = 1;
			path.stop();
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

const generateGroupStart = functionLabel =>
	t.expressionStatement(
		t.callExpression(
			t.memberExpression(t.identifier('console'), t.identifier('group')),
			[ t.stringLiteral(functionLabel) ]
		)
	);


const generateGroupEnd = () =>
	t.expressionStatement(
		t.callExpression(
			t.memberExpression(t.identifier('console'), t.identifier('groupEnd')),
			[]
		)
	);

const getName = parent => {
	if (parent.node.key && parent.node.key.name) {
		return parent.node.key.name;
	}

	if (parent.node.id && parent.node.id.name) {
		return parent.node.id.name;
	}

	return 'anonymous function?';
}

function ConsoleGroupify (babel) {
	return {
		visitor: {
			BlockStatement: function (path) {
				path.traverse(ConsoleLogCheckerVisitor, { stack: stack, gotReturn });

				if (skipGrouping === 1) {
					path.stop();
				}

				if (stack === 2) {
					const name = getName(path.getFunctionParent());
					path.unshiftContainer('body', generateGroupStart(name));

					if (gotReturn === 0) {
						path.pushContainer('body', generateGroupEnd());
					}
				}

				stack = 0;
				gotReturn = 0;
				skipGrouping = 0;
			}
		}
	}

}

module.exports = ConsoleGroupify;
