//@format

class ANode {
  eval(_env) {
    console.warn('ANode.eval', this);
    return nullNode();
  }
  evalToValue(_env) {
    return null;
  }
}

class ValueNode extends ANode {
  constructor(v) {
    super();
    this.v = v;
  }

  evalToValue(env) {
    return this.v.eval(env);
  }

  eval(env) {
    return document.createTextNode('' + this.evalToValue(env));
  }
}

class CommentNode extends ANode {
  constructor(body) {
    super();
    this.body = body;
  }

  evalToValue(_env) {
    return null;
  }

  eval(env) {
    console.info.apply(
      console,
      this.body.map((child) => child.evalToValue(env))
    );
    return null;
  }
}

function nullNode() {
  return null;
}

class DefnNode extends ANode {
  constructor(name, args, body) {
    super();
    this.name = name;
    this.args = args;
    this.body = body;
  }

  eval(env) {
    const fnName = this.name.eval(env),
      // all should be strings
      argNames = this.args.map((arg) => arg.eval(env));
    env.setFn(fnName, new Fn(fnName, argNames, this.body));
    return nullNode();
  }
}

class LetNode extends ANode {
  constructor(binds, body) {
    super();
    this.binds = binds;
    this.body = body;
  }

  eval(env0) {
    const env = env0.enter();
    for (let bind of this.binds) {
      if (bind instanceof KeyVal) {
        env.set(bind.key, bind.val.eval(env));
      }
    }

    return this.body.map((child) => child.eval(env));
  }
}
class CondNode extends ANode {
  constructor(body) {
    super();
    this.body = body;
  }

  eval(env) {
    for (let node of this.body) {
      if (node instanceof ElseNode) {
        return node.eval(env);
      } else if (node instanceof IfNode && node.shouldEval(env)) {
        return node.evalTrue(env);
      } else {
        node.eval(env);
      }
    }

    return nullNode();
  }
}
class ForNode extends ANode {
  constructor(bind, iter, body) {
    super();
    this.bind = bind;
    this.iter = iter;
    this.body = body;
  }

  eval(env0) {
    const varName = this.bind.eval(env0),
      items = this.iter.eval(env0),
      env = env0.enter(),
      result = [];

    for (let item of items) {
      env.set(varName, item);
      result.push(this.body.map((child) => child.eval(env)));
    }

    return result;
  }
}
class CallNode extends ANode {
  constructor(fn, args) {
    super();
    this.fn = fn;
    this.args = args;
  }

  eval(env) {
    const fnName = this.fn.eval(env),
      fn = env.lookupFn(fnName);

    if (fn) {
      const args = this.args.map((arg) => arg.eval(env)),
        result = fn.eval(env, args);
      return result === undefined ? null : result;
    } else {
      console.warn(fnName, 'not found');
      return nullNode();
    }
  }
}

class IfNode extends ANode {
  constructor(args, body) {
    super();
    this.args = args;
    this.body = body;
  }

  shouldEval(env) {
    // TODO:
    // a
    // a=b
    // a ne b
    const head = this.args[0],
      v = head.eval(env);
    return !!v;
  }

  eval(env) {
    if (this.shouldEval(env)) {
      return this.evalTrue(env);
    } else {
      return nullNode();
    }
  }

  evalTrue(env) {
    return this.body.map((child) => child.eval(env));
  }
}

class ElseNode extends ANode {
  constructor(body) {
    super();
    this.body = body;
  }

  eval(env) {
    return this.body.map((child) => child.eval(env));
  }
}

function flattenAppend(node, nodes) {
  for (let child of nodes) {
    if (child === null) {
      continue;
    }

    if (Array.isArray(child)) {
      flattenAppend(node, child);
    } else if (child instanceof Node) {
      node.appendChild(child);
    } else {
      node.appendChild(document.createTextNode('' + child));
    }
  }
}

class DomNode extends ANode {
  constructor(tagName, attributes, childs) {
    super();
    this.tagName = tagName;
    this.attributes = attributes;
    this.childs = childs;
  }

  eval(env) {
    const node = document.createElement(this.tagName),
      childs = this.childs.map((child) => child.eval(env));

    for (let {name, value} of this.attributes) {
      node.setAttribute(name, value);
    }

    flattenAppend(node, childs);

    return node;
  }
}

ANode.fromDOM = function (node) {
  if (node instanceof Text) {
    return new ValueNode(new Str(node.textContent));
  }

  const {childNodes, attributes, tagName} = node,
    attrs = parseAttrs(attributes),
    {order} = attrs,
    childs = new Array(childNodes.length);

  for (let i = 0; i < childNodes.length; i++) {
    childs[i] = ANode.fromDOM(childNodes[i]);
  }
  console.log('fromDOM', node, childs);

  switch (tagName) {
    case 'V':
      return new ValueNode(order[0]);
    case 'DEFN':
      return new DefnNode(order[0], order.slice(1), childs);
    case 'LET':
      return new LetNode(order, childs);
    case 'COND':
      return new CondNode(childs);
    case 'FOR':
      return new ForNode(order[0], order[2], childs);
    case 'IF':
      return new IfNode(order, childs);
    case 'ELSE':
      return new ElseNode(childs);
    case 'DO':
      return new CallNode(order[0], order.slice(1), childs);
    case 'NB':
      return new CommentNode(childs);
    default:
      return new DomNode(tagName, attributes, childs);
  }
};

function parseAttrs(attributes) {
  const byName = {},
    orderRaw = [],
    order = [];

  if (attributes !== undefined) {
    for (let {name, value} of attributes) {
      byName[name] = value;
      orderRaw.push({name, value});
      order.push(parseAttr(name, value));
    }
  }

  return {byName, order, orderRaw};
}

class Value {
  eval(_env) {
    return nullNode();
  }
}

class Num extends Value {
  constructor(v) {
    super();
    this.v = v;
  }

  eval(_env) {
    return this.v;
  }
}

class Var extends Value {
  constructor(name) {
    super();
    this.name = name;
  }

  eval(env) {
    const val = env.lookup(this.name);
    return val === undefined
      ? null
      : val instanceof Value
      ? val.eval(env)
      : val;
  }
}

class Bool extends Value {
  constructor(v) {
    super();
    this.v = v;
  }

  eval(_env) {
    return this.v;
  }
}

class Str extends Value {
  constructor(v) {
    super();
    this.v = '' + v;
  }

  eval(_env) {
    return this.v;
  }
}

class KeyVal {
  constructor(key, val) {
    this.key = key;
    this.val = val;
  }

  eval(_env) {
    return this.val;
  }
}

function parseValue(v) {
  const asNum = +v;
  if (Number.isFinite(asNum)) {
    return new Num(asNum);
  } else if (v[0] === '$') {
    return new Var(v.slice(1));
  } else if (v === 'true' || v === 'false') {
    return new Bool(v === 'true');
  } else {
    return new Str(v);
  }
}

function parseAttr(name, value) {
  if (value === '') {
    return parseValue(name);
  } else {
    return new KeyVal(name, parseValue(value));
  }
}

function htmlToANode(html) {
  const parser = new DOMParser(),
    doc = parser.parseFromString(html, 'text/html'),
    rootNode = doc.body.childNodes[0],
    anode = ANode.fromDOM(rootNode);

  return anode;
}

function fromString(s) {
  return htmlToANode(s);
}

class Env {
  constructor(parentEnv, stack) {
    this.parentEnv = parentEnv;
    this.bindings = {};
    this.isBoundary = false;
    this.fns = {};
    // mutable stack shared on all envs between boundaries
    this.stack = stack || [];
  }

  enter() {
    return new Env(this, this.stack);
  }

  enterBoundary() {
    const env = new Env(this, []);
    env.isBoundary = true;
    return env;
  }

  leave() {
    return this.parentEnv;
  }

  setFn(key, val) {
    this.fns[key] = val;
  }

  lookupFn(key) {
    const v = this.fns[key];
    if (v !== undefined) {
      return v;
    }
    const {parentEnv} = this;
    if (parentEnv !== null) {
      return parentEnv.lookupFn(key);
    }
    return null;
  }

  push(v) {
    this.stack.push(v);
  }
  pop() {
    return this.stack.pop();
  }

  set(key, val) {
    this.bindings[key] = val;
  }

  lookup(key, defVal) {
    const v = this.bindings[key];
    if (v !== undefined) {
      return v;
    }
    const {parentEnv, isBoundary} = this;
    if (!isBoundary && parentEnv !== null) {
      return parentEnv.lookup(key, defVal);
    }
    return defVal;
  }

  _setNativeFn2(name, fn) {
    this.setFn(name, new NativeFn(2, fn));
  }

  _setNativeFn0(name, fn) {
    this.setFn(name, new NativeFn(0, fn));
  }

  _bindPrelude() {
    this._setNativeFn0('push', (env, [v]) => {
      env.push(v);
      return null;
    });
    this._setNativeFn0('pop', (env, _args) => {
      return env.pop();
    });

    this._setNativeFn0('set', (env, [name]) => {
      const v = env.pop();
      env.set(name, v);
      return null;
    });

    this._setNativeFn0('range', (env, [a, b]) => {
      const arr = [];
      for (let i = a; i < b; i++) {
        arr.push(i);
      }

      env.push(arr);
      return null;
    });

    this._setNativeFn2('add', (env, _args, a, b) => {
      env.push(a + b);
      return null;
    });
    this._setNativeFn2('sub', (env, _args, a, b) => {
      env.push(a - b);
      return null;
    });
    this._setNativeFn2('mul', (env, _args, a, b) => {
      env.push(a * b);
      return null;
    });
    this._setNativeFn2('rem', (env, _args, a, b) => {
      env.push(a % b);
      return null;
    });
    this._setNativeFn2('div', (env, _args, a, b) => {
      env.push(a / b);
      return null;
    });
    this._setNativeFn2('eq', (env, _args, a, b) => {
      env.push(a === b);
      return null;
    });
    this._setNativeFn2('ne', (env, _args, a, b) => {
      env.push(a !== b);
      return null;
    });
    this._setNativeFn2('lt', (env, _args, a, b) => {
      env.push(a < b);
      return null;
    });
    this._setNativeFn2('le', (env, _args, a, b) => {
      env.push(a <= b);
      return null;
    });
    this._setNativeFn2('gt', (env, _args, a, b) => {
      env.push(a > b);
      return null;
    });
    this._setNativeFn2('ge', (env, _args, a, b) => {
      env.push(a >= b);
      return null;
    });
    this._setNativeFn2('and', (env, _args, a, b) => {
      env.push(!!(a && b));
      return null;
    });
    this._setNativeFn2('or', (env, _args, a, b) => {
      env.push(!!(a || b));
      return null;
    });
    return this;
  }
}

class Fn {
  constructor(name, args, body) {
    this.name = name;
    this.args = args;
    this.body = body;
  }

  _setEnv(env0, args) {
    const env = env0.enterBoundary();
    for (let i = 0; i < args.length; i++) {
      env.set(this.args[i], args[i]);
    }
    return env;
  }

  evalToValue(env0, args) {
    const env = this._setEnv(env0, args);
    let last = null;
    this.body.forEach((child) => {
      last = child.evalToValue(env);
    });
    return last;
  }

  eval(env0, args) {
    const env = this._setEnv(env0, args),
      dom = this.body.map((child) => child.eval(env));

    env0.push(env.pop());

    return dom;
  }
}

class NativeFn {
  constructor(popCount, fn) {
    this.popCount = popCount;
    this.fn = fn;
  }

  eval(env, args) {
    const len = this.popCount + 2,
      fnArgs = new Array(len);

    fnArgs[0] = env;
    fnArgs[1] = args;

    for (let i = len - 1; i >= 2; i--) {
      fnArgs[i] = env.pop();
    }

    return this.fn.apply(null, fnArgs);
  }
}

function evalTo(anode, target) {
  const dom = anode.eval(new Env(null)._bindPrelude());
  target.appendChild(dom);
  return dom;
}

window.evalStringToTarget = function (s, targetNode) {
  const anode = fromString(s);
  return evalTo(anode, targetNode);
};

window.evalFromTo = function (templateNode, targetNode) {
  console.log(templateNode.content.cloneNode(true));
  const anode = ANode.fromDOM(
    templateNode.content.firstElementChild.cloneNode(true)
  );
  evalTo(anode, targetNode);
};
