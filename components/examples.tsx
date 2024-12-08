import Image from "next/image"
import { Card } from "@/components/ui/card"

interface Example {
  id: number
  input: string
  output: string
  alt: string
}

const examples: Example[] = [
  {
    id: 1,
    input: "/example1.png",
    output: "/example1_outpainted.png",
    alt: "Cosmic scene with planets",
  },
  {
    id: 2,
    input: "/example2.png",
    output: "/example2_outpainted.png",
    alt: "Character with green foliage",
  },
  {
    id: 3,
    input: "/example3.png",
    output: "/example3_outpainted.png",
    alt: "Black and white manga portrait",
  },
  {
    id: 4,
    input: "/example4.png",
    output: "/example4_outpainted.png",
    alt: "Action scene with character in red",
  },
]

export function Examples() {
  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-gray-600">See how our AI expands these images:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {examples.map((example) => (
          <Card
            key={example.id}
            className="group relative bg-white overflow-hidden border-0 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_12px_24px_rgba(0,0,0,0.1)]"
          >
            <div className="space-y-2">
              <div className="relative aspect-square">
                <Image
                  src={example.input}
                  alt={`Input ${example.alt}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square">
                <Image
                  src={example.output}
                  alt={`Output ${example.alt}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-medium">
                  Click to try this style
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

