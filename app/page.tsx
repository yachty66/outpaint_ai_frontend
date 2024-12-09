import { ImageUpload } from "@/components/image-upload"
import { Header } from "@/components/header"
import { Examples } from "@/components/examples"
import { Star } from 'lucide-react'

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-12 sm:py-24 flex flex-col items-center justify-center gap-8">
        <div className="relative">
          <Star className="absolute -left-16 -top-8 w-12 h-12 text-rose-500 rotate-12" />
          <h1 className="text-4xl sm:text-5xl md:text-[64px] leading-none font-extrabold tracking-tight text-center">
            StableCharacter
            <br />
            outpainting
          </h1>
          <Star className="absolute -right-16 top-0 w-12 h-12 text-emerald-500 -rotate-12" />
        </div>
        <div className="text-center space-y-2 text-gray-600">
          <p className="text-base sm:text-lg">
            Turn any image into an expanded masterpiece with AI outpainting.
          </p>
          <p className="text-sm sm:text-base">Simply upload your image and let our AI extend it naturally.</p>
          {/* <p className="text-sm">You can also use our API for automated image processing.</p> */}
        </div>
        <ImageUpload />
        <Examples />
      </main>
      <footer className="py-6 text-center text-sm text-gray-600">
        Built with 💻 by{" "}
        <a href="https://twitter.com/yachty66" className="hover:underline">
          @yachty66
        </a>
        {" & "}
        <a href="https://twitter.com/tigran_iii" className="hover:underline">
          @tigran_iii
        </a>
      </footer>
    </div>
  )
}