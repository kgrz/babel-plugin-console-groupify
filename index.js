const t = require('babel-types');

const ConsoleLogCheckerVisitor = {
	BlockStatement: function (path, args) {
		path.stop();
	},
	Identifier: function (path, args) {
		const name = path.node.name;
		let state = args.state;

		if (name === 'console') {
			if (state.stack === 0) {
				state.stack++;
			}
		}

		if (name === 'group' || name === 'groupEnd') {
			state.gotConsoles = false;
			state.gotGroup = true;
			path.stop();
			return;
		}

		if (name === 'log') {
			if (state.stack === 1) {
				state.stack++;
			}
		}

		if (state.stack === 2) {
			state.gotConsoles = true;
			path.stop();
			return;
		}
	},
	ReturnStatement: function (path, args) {
		path.insertBefore(
			generateGroupEnd()
		);
		args.state.gotReturn = true;
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
				let state = {
					stack: 0,
					gotConsoles: false,
					gotGroup: false,
					gotReturn: false
				};

				path.traverse(
					ConsoleLogCheckerVisitor,
					{ state }
				);

				if (state.gotGroup) {
					path.stop();
					return;
				}

				if (state.gotConsoles) {
					const name = getName(path.getFunctionParent());
					path.unshiftContainer('body', generateGroupStart(name));

					if (!state.gotReturn) {
						path.pushContainer('body', generateGroupEnd());
					}

					path.stop();
					return;
				}
			}
		}
	}

}

module.exports = ConsoleGroupify;
