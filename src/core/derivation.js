function stripOuterParens(texStr) {
  if (!texStr) return "";
  let s = texStr.trim();
  if (s.startsWith("\\left(") && s.endsWith("\\right)")) {
    return s.slice(6, -7).trim();
  }
  if (s.startsWith("(") && s.endsWith(")")) {
    // Only strip if the outer parenthesis encloses the entire expression
    let depth = 0;
    let wrapsAll = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      if (depth === 0) {
        wrapsAll = false;
        break;
      }
    }
    if (wrapsAll) return s.slice(1, -1).trim();
  }
  return s;
}