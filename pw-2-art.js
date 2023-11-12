module.exports = function PwToArt({types: t}) {
  return {
    visitor: {
      ImportDeclaration(path) {
        if(path.node.source.value == "@playwright/test") {
          path.remove();
        }
      },
      CallExpression(path) {
        const parent = path.parent;
        const comments = parent && parent.leadingComments;

        if (comments && comments.length > 0) {
          // Obtén el valor del comentario y asigna el nombre a la función
          const commentValue = comments[comments.length - 1].value.trim();
          if (t.isIdentifier(path.node.callee)) {
            path.node.callee.name = commentValue.replace("@pw2art: ", "");
          }
        }
      }
    }
  };
};