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

**Note that both these plugins are at a pretty alpha quality.**
