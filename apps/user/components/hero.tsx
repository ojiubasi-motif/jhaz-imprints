import { ArrowRight, Star } from "lucide-react"
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 lg:pt-20">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-cream" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B4332' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 py-16 md:py-20 lg:grid-cols-2 lg:gap-12 lg:py-28 items-center">
          {/* Text Content */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-sm font-medium text-accent">
              <Star className="h-3.5 w-3.5 fill-accent" />
              Premium Nigerian Fashion
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl lg:text-6xl xl:text-7xl font-[family-name:var(--font-playfair)] text-balance">
              Wear Your Culture,{" "}
              <span className="text-accent">Your Way</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Custom-tailored Nigerian traditional outfits, crafted with
              premium fabrics and delivered to your doorstep. From Agbada to
              Ankara, every stitch tells your story.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#styles"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-green-mid hover:shadow-xl hover:shadow-primary/20"
              >
                Order Now
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/20 px-8 py-4 text-base font-semibold text-primary transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                How It Works
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cream bg-green-mid text-xs font-bold text-primary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-accent text-accent"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Trusted by <span className="font-semibold text-primary">2,000+</span> happy customers
                </p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl lg:rounded-3xl">
              <Image
                src="/images/hero.jpg"
                alt="Nigerian man and woman in premium traditional attire - agbada and ankara gown"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Overlay accent border */}
              <div className="absolute inset-0 rounded-2xl lg:rounded-3xl ring-1 ring-inset ring-primary/10" />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-card p-4 shadow-xl sm:p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Made to Measure</p>
              <p className="mt-1 text-2xl font-bold text-primary font-[family-name:var(--font-playfair)]">
                100%
              </p>
              <p className="text-sm font-medium text-accent">Custom Fit</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
