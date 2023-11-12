module.exports = function PwToArt({types: t}) {
  return {
    visitor: {
      ImportDeclaration(path) {
        if(path.node.source.value == "@playwright/test") {
          path.remove();
        }
      },
      CallExpression(path) {
        if(path.node.callee.name !== 'test') return;
        if(!t.isIdentifier(path.node.callee)) return;

        const functionName = getFunctionName(path);
        const executingBlock = path.node.arguments[1].body;
        const functionDeclaration = t.functionDeclaration(
          t.identifier(functionName), 
          [],
          executingBlock
        );

        path.replaceWith(functionDeclaration);
      }
    }
  };
};


const getFunctionName = (path)=> {

  const parent = path.parent;
  const fn = parent && parent.leadingComments?.[0]?.value.trim();
  
  const altNameFunction = `execute_${path.parentPath.parent.body.indexOf(path.parent)}`;
  if (!fn) return altNameFunction;

  return fn.replace(/@pw2art: /, '');
}