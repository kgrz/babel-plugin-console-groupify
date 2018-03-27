const babel = require('babel-core');
const plugin = require('./index');
const classPropertyTransformer = require('babel-plugin-transform-class-properties');

console.group = jest.fn();
console.groupEnd = jest.fn();

it('wraps console.log inside a group', () => {
	const example = `
	function something() {
		console.log('wut');
	}
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});

it('wraps only the inner console.log inside a group', () => {
	const example = `
	function something() {
		function another() {
			console.log('wut');
		}
	}
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});

it('maintains the hierarchy when multiple logs are encountered', () => {
	const example = `
	function something() {
		console.log('whut');

		function another() {
			console.log('wut');
		}
	}
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});

it('works with a return statement', () => {
	const example = `
	function something() {
		console.log('wut');
		return 1;
	}
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});

it('works with a multiple log statements', () => {
	const example = `
	function something() {
		console.log('one');
		console.log('two');
		console.log('three');
		console.log('four');
	}
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});

it('works with a multiple log statements, and a return statement', () => {
	const example = `
	function something() {
		console.log('one');
		console.log('two');
		return 0;
		console.log('three');
		console.log('four');
	}
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});

it('works with anonymous functions', () => {
	const example = `
	setTimeout(function() {
		console.log('one');
		return 0;
	}, 0);
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});


it('works with arrow functions', () => {
	const example = `
	const fun = () => {
		console.log('one');
		return 0;
	}
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});

it('works with class methods', () => {
	const example = `
	class A {
		componentWillReceiveProps (nextProps) {
			console.log(this.props);
			console.log(nextProps)
		}
	}
	`;

	const code = babel.transform(example, { plugins: [plugin] }).code;
	expect(code).toMatchSnapshot();
});

it('works with class function properties', () => {
	const example = `
	class A {
		componentWillReceiveProps = (nextProps) => {
			console.log(this.props);
			console.log(nextProps)
		}
	}
	`;

	const code = babel.transform(example, { plugins: [plugin, classPropertyTransformer] }).code;
	expect(code).toMatchSnapshot();
});

it('does not add a grouping if one is already present', () => {
	const example = `
	class A {
		componentWillReceiveProps = (nextProps) => {
			console.group('one');
			console.log(this.props);
			console.log(nextProps)
		}
	}
	`;

	const code = babel.transform(example, { plugins: [plugin, classPropertyTransformer] }).code;
	expect(code).toMatchSnapshot();
});

it('does not add extra groupend just because of return', () => {
	const example = `
	function a () {
	  return;
	}
	`;

	const code = babel.transform(example, { plugins: [plugin, classPropertyTransformer] }).code;
	expect(code).toMatchSnapshot();
});

it('works normally for async functions', () => {
	const example = `
	const foo = () => {
		console.log('this is foo');
	}

	const bar = () => {
		console.log('this is bar');
		setTimeout(foo);
		console.log('this comes after the setTimeout');
	}
	`;

	const code = babel.transform(example, { plugins: [plugin, classPropertyTransformer] }).code;
	expect(code).toMatchSnapshot();
});

it('adds correct indentation for early return cases in if statements', () => {
	const example = `
	const foo = option => {
		console.log('hi')

		if (option) {
			return 'Early Return!';
		}

		return 'Late Return!';
	}

	foo(true);
	foo(false);
	`;

	const code = babel.transform(example, { plugins: [plugin, classPropertyTransformer] }).code;
	expect(code).toMatchSnapshot();
});

it('adds correct indentation for early return cases in switch statements', () => {
	const example = `
	const foo = option => {
		console.log('hi')

		switch (option.toLocaleString()) {
			case 'true': {
				return 'Early Return!';
			}
			case 'false': {
				return 'Another Early Return!';
			}
		}

		return 'Late Return!';
	}

	foo(true);
	foo(false);
	`;

	const code = babel.transform(example, { plugins: [plugin, classPropertyTransformer] }).code;
	expect(code).toMatchSnapshot();
});

it('avoid unnecessary groups in deep hierarchies', () => {
	const example = `
	function request() {
		if (true) {
			// do something
			if (true) {
				// do something esle
				if (true) {
					console.log('whaaat!')
				}
			}
		}
	}
	`

	const code = babel.transform(example, { plugins: [plugin, classPropertyTransformer] }).code;
	expect(code).toMatchSnapshot();
});

describe('promises', () => {
	it('works with named functions as args to then', () => {
		const example = `
		const a = new Promise((resolve, reject) => {
			resolve(42);
		});

		const thenFunc = (value) => {
			console.log(value);
		}

		a.then(thenFunc);
		`;

		const code = babel.transform(example, { plugins: [plugin, classPropertyTransformer] }).code;
		expect(code).toMatchSnapshot();
	});
});
