module.exports = function PwToArt({types: t}) {
  return {
    visitor: {
      ImportDeclaration(path) {
        if(path.node.source.value == "@playwright/test") {
          path.remove();
        }
      },
      ExpressionStatement(path) {
        const expressionChild = path.node.expression;
        if(!t.isCallExpression(expressionChild)) return;
        if(expressionChild.callee.name !== 'test') return;
        const functionName = getFunctionName(path);
        const executingBlock = expressionChild.arguments[1].body;
        const params = expressionChild.arguments[1].params;
        const functionDeclaration = t.functionDeclaration(
          t.identifier(functionName), 
          params,
          t.blockStatement([executingBlock]),
          false,
          true
        );
        path.replaceWith(functionDeclaration);
      },
      CallExpression(path) {
        if(t.isMemberExpression(path.node.callee)) console.log(path.node.callee.property.name)
        // check if name is expect and replace by null:
        if(t.isMemberExpression(path.node.callee) && path.node.callee.property.name === 'expect') {
          
          path.remove();
        }
      }
    }
  };
};


const getFunctionName = (parent_path)=> {
  const parent_node = parent_path.node;
  const fn = parent_node && parent_node.leadingComments?.[0]?.value.trim();
  
  const altNameFunction = `execute_${parent_path.parent.body.indexOf(parent_node)}`;
  if (!fn) return altNameFunction;

  return fn.replace(/@pw2art: /, '');
}