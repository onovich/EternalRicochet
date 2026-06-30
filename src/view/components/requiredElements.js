export function requireElements(ids) {
  const missing = ids.filter((id) => !document.getElementById(id));

  if (missing.length > 0) {
    throw new Error(`Missing game DOM nodes: ${missing.join(", ")}`);
  }
}
