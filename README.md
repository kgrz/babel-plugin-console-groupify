Console Groupify plugin for Babel
---------------------------------


Scratching another itch with this. Sometimes when I'm developing in
React, I wish there was a way to group the `console.log` statements when
used inside the life-cycle functions, and add some kind of visual
separation between `console.log`s in different functions.

This plugin checks for `console.log`s inside functions, and wraps them
inside a `console.group`/`console.groupEnd` set, with the function name
passed in as a variable for `console.group`. For example:

```javascript

function aFunctionDeclaration () {
  console.log('hi');
}

const aFunctionExpression = function () {
  console.log('hi')
}

const anArrowFunction = () => {
  console.log('hi')
}

```

ends up looking like:


```
▼ aFunctionDeclaration
  | hi

▼ aFunctionExpression
  | hi

▼ anArrowFunction
  | hi
```


Combining this with the
https://github.com/kgrz/babel-plugin-transform-console-log-variable-names,
the printf-debugging becomes way better. For example, in a React
component:


```javascript
class MyComponent extends React.Component {
  componentWillReceiveProps ( nextProps ) {
    console.log(this.props);
    console.log(nextProps);
  }
}
```

prints out:

```
▼ componentWillReceiveProps
  | this.props: { prop1: "one" }
  | nextProps: { prop1: "two. what the!" }

```


Actual screenshot from actual usage:

![both-plugins-together](https://user-images.githubusercontent.com/400299/31451006-90ae7798-aec8-11e7-8ca1-83bada8343f9.png)

**Note that both these plugins are at a pretty alpha quality.**



Usage
-----

Install the module with:

```
npm install --save babel-plugin-console-groupify
```

Include it in your babel configuration either via `.babelrc` or webpack.
Here's a `.babelrc` example:

```json
{
	"presets": [...],
	"plugins": [
		"console-groupify"
	]
}
```

Known Issues
------------

* A spread operator inside a switch statement seems to be causing issues
  when used with the `babel-transform-object-rest-spread` plugin. For
  instance:

  ```javascript

  function myReducer (state = {}, action = {}) {
    console.log('hi');
    switch (action.type) {
      case 'some_action':
        return { ...state, key: value }
    }
  }
  ```
