module.exports = function PwToArt({types: t}) {
  return {
    visitor: {
      ImportDeclaration(path) {
        if(path.node.source.value == "@playwright/test")
          return path.remove();

        if(path.node.source.value.includes('on-rails'))
          return path.remove();
      },
      ExpressionStatement(path, state) {
        if(checkIsTestDescribe(path, t))
          return extractBodyFromTestDescribe(path);

        if(checkIsExpectSentence(path) || checkIsTestHook(path, t) || checkIsRubyHelper(path)) 
          return path.remove();

        if(checkIsTestMethodCall(path, t))
          return replaceForExecutableFunction(path, state, t);
      },
      Program: {
        enter(_, state) {
          // Inicializa el array en el estado
          state.generatedFunctions = [];
        },
        exit(path, state) {
          createExports(path, state, t)
        },
      }
    }
  };
};


const getFunctionName = (parent_path, state)=> {
  const parent_node = parent_path.node;
  const fn = parent_node && parent_node.leadingComments?.[0]?.value.trim();
  
  const altNameFunction = `execute_${state.generatedFunctions.length + 1}`;
  if (!fn) return altNameFunction;

  return fn.replace(/@pw2art: /, '');
}

const extractBodyFromTestDescribe = (path) => {
  const bodyNodes = path.node.expression.arguments[1].body.body;
  path.replaceWithMultiple(bodyNodes);
}

const replaceForExecutableFunction = (path, state, t) => {
  const expressionChild = path.node.expression;
  const functionName = getFunctionName(path, state);
  const executingBlock = expressionChild.arguments[1].body;
  const params = expressionChild.arguments[1].params?.[0];
  const { properties } = params;
  const paramName = t.isIdentifier(properties[0].key) ? properties[0].key.name : null;
  state.generatedFunctions.push(functionName);

  const functionDeclaration = t.functionDeclaration(
    t.identifier(functionName), 
    [t.identifier(paramName)],
    executingBlock,
    false,
    true
  );
  path.replaceWith(functionDeclaration);
}

const createExports = (path, state, t) => {
  const specifiers = state.generatedFunctions.map((funcName) => {
    const id = t.identifier(funcName);
    return  t.objectProperty(id, id);
  });

  const objectExpression = t.objectExpression(specifiers);

  const moduleExports = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(t.identifier('module'), t.identifier('exports')),
      objectExpression
    )
  );

  path.pushContainer('body', moduleExports);
}

const checkIsExpectSentence = (path) => {
  return path?.node?.expression?.argument?.callee?.object?.callee?.name === 'expect';
};

const checkIsTestDescribe = (path, t) => {
  return t.isCallExpression(path.node.expression)  &&
    path.node.expression.callee?.object?.name === 'test' &&
    path.node.expression.callee?.property?.name === 'describe';
}

const checkIsTestHook = (path, t) => {
  if (!t.isCallExpression(path.node.expression)  ||
    path.node.expression.callee?.object?.name !== 'test')
    return false;
  const calleeProp = path.node.expression.callee?.property?.name;

  return !!calleeProp  && ['before', 'after'].filter((part_hook) => calleeProp.includes(part_hook)).length > 0;
}

const checkIsRubyHelper = (path) => {
  return path.node.expression?.callee?.name?.includes('app');
}

const checkIsTestMethodCall = (path, t) => {
  const expressionChild = path.node.expression;
  return t.isCallExpression(expressionChild) && expressionChild.callee.name === 'test';
}