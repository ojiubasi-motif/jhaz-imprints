import { Search, Palette, CreditCard, Truck } from "lucide-react"

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Browse Styles",
    description:
      "Explore our curated collection of traditional Nigerian outfits — from regal Agbada to vibrant Ankara designs.",
  },
  {
    icon: Palette,
    step: "02",
    title: "Customize Your Order",
    description:
      "Choose your fabric, color, and size. Share your measurements and any custom design preferences with us.",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Pay Securely with Paystack",
    description:
      "Complete your purchase with confidence using Paystack — Nigeria's most trusted payment gateway.",
  },
  {
    icon: Truck,
    step: "04",
    title: "Get It Delivered",
    description:
      "Sit back and relax. Your custom-tailored outfit will be delivered right to your doorstep, nationwide.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-primary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Simple Process
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl font-[family-name:var(--font-playfair)] text-balance">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/70 leading-relaxed">
            From browsing to delivery, we make ordering your custom traditional
            outfit simple and stress-free.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="group relative rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 transition-all hover:bg-primary-foreground/10 hover:border-gold/30"
            >
              {/* Step number */}
              <span className="text-5xl font-bold text-primary-foreground/10 font-[family-name:var(--font-playfair)]">
                {step.step}
              </span>

              {/* Icon */}
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/20">
                <step.icon className="h-6 w-6 text-gold" />
              </div>

              <h3 className="mt-4 text-lg font-bold text-primary-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/60">
                {step.description}
              </p>

              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 hidden h-px w-8 -translate-y-1/2 translate-x-full bg-primary-foreground/20 lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
