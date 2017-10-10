const babel = require('babel-core');
const plugin = require('./index');

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
