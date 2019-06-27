const t = require('babel-types');

const ANONYMOUS_FUNCTION = 'anonymous function';

const ConsoleLogCheckerVisitor = {
	BlockStatement: function (path, args) {
		if (t.isFunction(path.parent)) {
			path.skip();
		}

		let state = { gotReturnInsideBlock: false }

		path.traverse({
			ReturnStatement: function (path, args) {
				args.gotReturnInsideBlock = true;
			}
		}, state);

		if (!state.gotReturnInsideBlock) {
			path.skip();
		}
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
			const name = getName(path);
			// Skip adding the groups if there's a return before the console.log
			if (name !== ANONYMOUS_FUNCTION && !args.state.gotReturn) {
				state.gotConsoles = true;
			}
			// Skip further traversal. We have what we need at this point.
			path.skip();
			return;
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


const getName = path => {
	const fParent = path.findParent(p => t.isFunction(p));

	let name = ANONYMOUS_FUNCTION;

	if (!fParent) {
		return name;
	}

	switch (fParent.type) {
		case 'FunctionDeclaration':
			name = fParent.node.id.name;
			break;
		case 'FunctionExpression':
		case 'ArrowFunctionExpression':
			if (fParent.parent.id && fParent.parent.id.name) {
				name = fParent.parent.id.name
			}

			if (fParent.node.id && fParent.node.id.name) {
				name = fParent.node.id.name
			}

			if (fParent.parent.left && fParent.parent.left.property && fParent.parent.left.property.name) {
				name = fParent.parent.left.property.name;
			}
			break;
		case 'ClassMethod':
			name = fParent.node.key.name;
	}

	return name;
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
					return;
				}

				if (state.gotConsoles) {
					const name = getName(path);
					if (name !== ANONYMOUS_FUNCTION) {
						path.unshiftContainer('body', generateGroupStart(name));
					}

					if (!state.gotReturn) {
						path.pushContainer('body', generateGroupEnd());
					}
				}
			}
		}
	}

}

module.exports = ConsoleGroupify;
