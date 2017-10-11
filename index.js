const t = require('babel-types');

const ConsoleLogCheckerVisitor = {
	BlockStatement: function (path, args) {
		path.skip();
	},
	Identifier: function (path, args) {
		const name = path.node.name;
		let state = args.state;

		if (name === 'console') {
			if (state.stack === 0) {
				state.stack++;
			}
		}

		// We need to explicitly check for state.gotReturn because we add the
		// console.groupEnd if we encounter a return statement in this
		// visitor. And that will cause this flag to turn on and skip rest of
		// the traversal.
		if (name === 'group' || (name === 'groupEnd' && !state.gotReturn)) {
			state.gotConsoles = false;
			state.gotGroup = true;
			path.skip();
			return;
		}

		if (name === 'log') {
			if (state.stack === 1) {
				state.stack++;
			}
		}

		if (state.stack === 2) {
			state.gotConsoles = true;
		}
	},
	ReturnStatement: function (path, args) {
		if (args.state.gotConsoles) {
			path.insertBefore(
				generateGroupEnd()
			);
		}

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
					path.skip();
					return;
				}

				if (state.gotConsoles) {
					const name = getName(path.getFunctionParent());
					path.unshiftContainer('body', generateGroupStart(name));

					if (!state.gotReturn) {
						path.pushContainer('body', generateGroupEnd());
					}
				}
			}
		}
	}

}

module.exports = ConsoleGroupify;
