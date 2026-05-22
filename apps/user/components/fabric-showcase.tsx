import Image from "next/image"
import { Ruler, Scissors, Palette, Sparkles } from "lucide-react"

const features = [
  {
    icon: Palette,
    title: "Premium Fabrics",
    description:
      "We source the finest Ankara, Aso-Oke, Guinea Brocade, Lace, and Swiss Voile from trusted Nigerian and international suppliers.",
  },
  {
    icon: Ruler,
    title: "Perfect Measurements",
    description:
      "Share your measurements using our simple guide, and we will tailor your outfit to fit you perfectly — no alterations needed.",
  },
  {
    icon: Scissors,
    title: "Expert Tailoring",
    description:
      "Our master tailors bring decades of experience in traditional Nigerian garment construction, ensuring every stitch is flawless.",
  },
  {
    icon: Sparkles,
    title: "Custom Embellishments",
    description:
      "Add embroidery, stonework, beading, or custom patterns to make your outfit uniquely yours.",
  },
]

export function FabricShowcase() {
  return (
    <section id="fabrics" className="py-20 lg:py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-2xl lg:rounded-3xl">
              <Image
                src="/images/fabrics.jpg"
                alt="Premium Nigerian fabrics including ankara, aso-oke, and lace materials"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 rounded-2xl lg:rounded-3xl ring-1 ring-inset ring-primary/10" />
            </div>

            {/* Floating accent */}
            <div className="absolute -bottom-6 -right-6 hidden rounded-xl bg-accent px-6 py-4 shadow-xl sm:block">
              <p className="text-sm font-bold text-green-deep">50+ Fabrics</p>
              <p className="text-xs text-green-deep/70">Available to choose from</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Craftsmanship
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-5xl font-[family-name:var(--font-playfair)] text-balance">
              Fabric & Customization
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Every detail matters. From fabric selection to final embroidery,
              we put your vision at the center of every outfit we create.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
