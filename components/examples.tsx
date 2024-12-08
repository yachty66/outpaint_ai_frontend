export function Examples() {
  const examples = [
    "Landscape",
    "Portrait",
    "Architecture",
    "Nature",
    "Abstract",
    "Urban",
  ]

  return (
    <div className="w-full space-y-2">
      <p className="text-sm text-gray-600">Try these example styles:</p>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            className="px-3 py-1 text-sm border-2 border-gray-300 rounded hover:bg-gray-50"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  )
}

