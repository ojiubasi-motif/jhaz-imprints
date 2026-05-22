import Image from "next/image"
import { ArrowRight } from "lucide-react"

const categories = [
  {
    name: "Agbada",
    description: "Flowing grandeur for distinguished occasions",
    image: "/images/agbada.jpg",
    tag: "Men",
  },
  {
    name: "Ankara",
    description: "Bold prints, modern silhouettes",
    image: "/images/ankara.jpg",
    tag: "Unisex",
  },
  {
    name: "Aso-Oke",
    description: "Hand-woven heritage, timeless elegance",
    image: "/images/aso-oke.jpg",
    tag: "Unisex",
  },
  {
    name: "Kaftan",
    description: "Refined comfort meets sleek style",
    image: "/images/kaftan.jpg",
    tag: "Men",
  },
  {
    name: "Iro & Buba",
    description: "Classic Yoruba grace, reimagined",
    image: "/images/iro-buba.jpg",
    tag: "Women",
  },
  {
    name: "Babariga",
    description: "Majestic robes for grand moments",
    image: "/images/babariga.jpg",
    tag: "Men",
  },
]

export function FeaturedStyles() {
  return (
    <section id="styles" className="py-20 lg:py-28 bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Our Collection
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-5xl font-[family-name:var(--font-playfair)] text-balance">
              Featured Styles
            </h2>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Every piece is a celebration of Nigerian heritage, tailored to
              your exact measurements and style preferences.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-accent"
          >
            View All Styles
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className="group relative overflow-hidden rounded-2xl bg-card"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={cat.image}
                  alt={`${cat.name} - Nigerian traditional attire`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

                {/* Tag */}
                <span className="absolute top-4 left-4 rounded-full bg-gold/90 px-3 py-1 text-xs font-semibold text-green-deep">
                  {cat.tag}
                </span>

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-cream font-[family-name:var(--font-playfair)]">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-sm text-cream/80">
                    {cat.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold transition-all group-hover:gap-3">
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
