// REGLA 18: el historial público no revela el nombre completo ni el correo
// del postor, solo un alias parcial. Ej: "Ana Torres" -> "An***".
export function toAlias(name: string): string {
  const clean = name.trim();
  const visible = clean.length > 2 ? 2 : 1;
  return `${clean.slice(0, visible)}***`;
}
