/**
 * Operational Transform engine (text)
 *
 * An operation is: { type: 'insert'|'delete'|'retain', pos: number, chars?: string, count?: number }
 * We use a simple, well-tested approach:
 *   - Each op carries the revision it was based on (clientRev).
 *   - We store all server ops since the beginning (or since last snapshot) in Redis.
 *   - On receiving a client op, we transform it against all ops the client hasn't seen yet.
 */

/**
 * Transform op A against concurrent op B (A happened "left" / first).
 * Returns a new op that can be applied to the state after B has been applied.
 */
function transformOp(a, b) {
  if (a.type === 'insert' && b.type === 'insert') {
    if (b.pos <= a.pos) return { ...a, pos: a.pos + b.chars.length };
    return a;
  }

  if (a.type === 'insert' && b.type === 'delete') {
    if (b.pos < a.pos) return { ...a, pos: Math.max(b.pos, a.pos - b.count) };
    return a;
  }

  if (a.type === 'delete' && b.type === 'insert') {
    if (b.pos <= a.pos) return { ...a, pos: a.pos + b.chars.length };
    return a;
  }

  if (a.type === 'delete' && b.type === 'delete') {
    if (b.pos + b.count <= a.pos) return { ...a, pos: a.pos - b.count };
    if (b.pos >= a.pos + a.count) return a;
    // Overlapping deletes — shrink or cancel
    const start = Math.min(a.pos, b.pos);
    const aEnd = a.pos + a.count;
    const bEnd = b.pos + b.count;
    const newCount = Math.max(0, aEnd - Math.max(a.pos, bEnd)) +
                     Math.max(0, Math.min(a.pos, b.pos) - a.pos);
    if (newCount <= 0) return null; // fully consumed by concurrent delete
    return { ...a, pos: start, count: newCount };
  }

  return a;
}

/**
 * Apply a single op to a string, returning the new string.
 */
function applyOp(doc, op) {
  if (op === null) return doc;
  if (op.type === 'insert') {
    return doc.slice(0, op.pos) + op.chars + doc.slice(op.pos);
  }
  if (op.type === 'delete') {
    return doc.slice(0, op.pos) + doc.slice(op.pos + op.count);
  }
  return doc;
}

/**
 * Transform incoming op against a list of concurrent server ops.
 * Returns { transformedOp, newDoc }
 */
function transformAgainstHistory(op, serverOps, currentDoc) {
  let transformed = op;
  for (const serverOp of serverOps) {
    transformed = transformOp(transformed, serverOp);
    if (!transformed) break;
  }
  const newDoc = transformed ? applyOp(currentDoc, transformed) : currentDoc;
  return { transformedOp: transformed, newDoc };
}

module.exports = { transformOp, applyOp, transformAgainstHistory };
