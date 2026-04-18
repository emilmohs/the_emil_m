// Maps Tailwind color class names to actual hex values
// This is needed because Tailwind purges dynamic class names like `bg-${color}`
const COLOR_MAP: Record<string, string> = {
  "red-500": "#ef4444",
  "orange-500": "#f97316",
  "amber-500": "#f59e0b",
  "green-500": "#22c55e",
  "blue-500": "#3b82f6",
  "indigo-500": "#6366f1",
  "purple-500": "#a855f7",
  "pink-500": "#ec4899",
  "gray-500": "#6b7280",
  // Fallbacks for common Tailwind color names
  "red-600": "#dc2626",
  "blue-600": "#2563eb",
  "green-600": "#16a34a",
  "yellow-500": "#eab308",
};

export function getTagColor(tailwindClass: string): string {
  return COLOR_MAP[tailwindClass] || "#6b7280"; // default gray
}

export { COLOR_MAP };
