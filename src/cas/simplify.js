/**
 * src/cas/simplify.js
 * Canonical AST simplification — the repo's missing pillar.
 * Pure tree rewrites; no solver or unit knowledge.
 *   - constant folding (num ⊕ num)
 *   - identity elimination (+0, -0, *1, /1, ^1, *0, 0/x, x-x)
 *   - double negation / minus-of-negative rewrites
 *   - n-ary additive flattening into signed term lists, re-emitted as a
 *     left-associated chain in SOURCE order (fixes peel-order artifacts)
 *   - fraction-level canonical leading sign (flips num+den together)
 *   - precedence-aware group pruning (parens kept only where needed)
 */

const PREC_PARENT_RULES = {
  "+":   inner => inner === "+" || inner === "-",
  "-":   inner => inner === "+",
  "*":   inner => inner === "*" || inner === "/",
  "/":   inner => inner === "*",
  "^":   () => false
};

function isNumNode(n, v) {
  return !!n && n.type === "num" && (v === undefined || Number(n.val) === v);
}
function numVal(n) { return Number(n.val); }
function isAtom(n) {
  return !!n && (n.type === "num" || n.type === "id" || n.type === "call");
}
function trimNum(v) {
  return String(Number(Number(v).toPrecision(12)));
}
function sameTree(a, b) {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === "num") return Number(a.val) === Number(b.val);
  if (a.type === "id") return a.name === b.name;
  return false;
}

export function negateSimple(node) {
  if (isNumNode(node)) return { type: "num", val: trimNum(-numVal(node)) };
  const u = node.type === "group" ? node.expr : node;
  if (u.type === "binary" && u.op === "-" && isNumNode(u.left, 0)) return u.right;
  return { type: "binary", op: "-", left: { type: "num", val: "0" }, right: { type: "group", expr: node } };
}

/**
 * Flatten any +/- tree into a signed term list, in source order.
 * @returns {Array<{sign: number, node: object}>}
 */
export function collectAddTerms(node) {
  const u = node && node.type === "group" ? node.expr : node;
  if (!u) return [];
  if (u.type === "binary" && (u.op === "+" || u.op === "-")) {
    const left = collectAddTerms(u.left);
    const right = collectAddTerms(u.right);
    const flipped = u.op === "-" ? right.map(t => ({ sign: -t.sign, node: t.node })) : right;
    return [...left, ...flipped];
  }
  return [{ sign: 1, node: u }];
}

/**
 * Re-emit a signed term list as a left-associated +/- chain.
 */
export function emitAddChain(terms, parentOp = null) {
  const live = terms.filter(t => !(isNumNode(t.node, 0)));
  if (live.length === 0) return { type: "num", val: "0" };

  // fold pure constants into one term, keeping the first constant slot
  const merged = [];
  let constSlot = -1;
  let constSum = 0;
  live.forEach(t => {
    if (isNumNode(t.node)) {
      constSum += t.sign * numVal(t.node);
      if (constSlot === -1) { constSlot = merged.length; merged.push(null); }
    } else {
      merged.push(t);
    }
  });
  if (constSlot >= 0) {
    merged[constSlot] = { sign: constSum < 0 ? -1 : 1, node: { type: "num", val: trimNum(Math.abs(constSum)) } };
    if (constSum === 0) merged.splice(constSlot, 1);
  }
  if (merged.length === 0) return { type: "num", val: "0" };

  let acc = merged[0].sign < 0 ? negateSimple(merged[0].node) : merged[0].node;
  for (let i = 1; i < merged.length; i++) {
    const t = merged[i];
    acc = {
      type: "binary",
      op: t.sign < 0 ? "-" : "+",
      left: acc,
      right: { type: "group", expr: t.node }
    };
  }
  // prune groups the parent operator does not need
  return simplifyAST(acc, parentOp);
}

function chainTerms(node) {
  return collectAddTerms(node);
}
function chainLeadingNegative(node) {
  const terms = chainTerms(node);
  return terms.length > 0 && terms[0].sign < 0;
}
function flipChain(node) {
  return emitAddChain(chainTerms(node).map(t => ({ sign: -t.sign, node: t.node })), null);
}

export function simplifyAST(node, parentOp = null) {
  if (!node) return node;

  if (node.type === "group") {
    const inner = simplifyAST(node.expr, parentOp);
    if (isAtom(inner)) return inner;
    if (inner.type === "binary" && parentOp === null) return inner;
    if (inner.type === "binary" && PREC_PARENT_RULES[parentOp]?.(inner.op)) return inner;
    return { type: "group", expr: inner };
  }

  if (node.type === "call") {
    return { type: "call", fn: node.fn, arg: simplifyAST(node.arg, null) };
  }

  if (node.type !== "binary") return node;

  // additive chains: flatten to signed terms, simplify each, re-emit in order
  if (node.op === "+" || node.op === "-") {
    const terms = collectAddTerms(node).map(t => ({ sign: t.sign, node: simplifyAST(t.node, "*") }));
    return emitAddChain(terms, parentOp);
  }

  let L = simplifyAST(node.left, node.op);
  let R = simplifyAST(node.right, node.op);

  // constant folding
  if (isNumNode(L) && isNumNode(R)) {
    const a = numVal(L), b = numVal(R);
    let v = null;
    if (node.op === "+") v = a + b;
    else if (node.op === "-") v = a - b;
    else if (node.op === "*") v = a * b;
    else if (node.op === "/" && b !== 0) v = a / b;
    else if (node.op === "^") v = Math.pow(a, b);
    if (v !== null && Number.isFinite(v)) return { type: "num", val: trimNum(v) };
  }

  // identities
  if (node.op === "+") {
    if (isNumNode(L, 0)) return R;
    if (isNumNode(R, 0)) return L;
  }
  if (node.op === "-") {
    if (isNumNode(R, 0)) return L;
    if (isNumNode(L, 0)) return negateSimple(R);
    if (sameTree(L, R)) return { type: "num", val: "0" };
  }
  if (node.op === "*") {
    if (isNumNode(L, 0) || isNumNode(R, 0)) return { type: "num", val: "0" };
    if (isNumNode(L, 1)) return R;
    if (isNumNode(R, 1)) return L;
  }
  if (node.op === "/") {
    if (isNumNode(L, 0)) return { type: "num", val: "0" };
    if (isNumNode(R, 1)) return L;
    // canonical leading sign: flip numerator+denominator together
    if (chainLeadingNegative(R)) {
      return simplifyAST({
        type: "binary", op: "/",
        left: { type: "group", expr: flipChain(L) },
        right: { type: "group", expr: flipChain(R) }
      }, parentOp);
    }
  }
  if (node.op === "^") {
    if (isNumNode(R, 1)) return L;
    if (isNumNode(R, 0)) return { type: "num", val: "1" };
  }

  return { type: "binary", op: node.op, left: L, right: R };
}
