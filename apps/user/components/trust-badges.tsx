import { ShieldCheck, Ruler, Truck } from "lucide-react"

const badges = [
  {
    icon: ShieldCheck,
    title: "Secure Payment via Paystack",
    description:
      "Your transactions are protected with bank-level encryption through Nigeria's leading payment platform.",
  },
  {
    icon: Ruler,
    title: "Made to Measure",
    description:
      "Every outfit is custom-tailored to your exact body measurements for the perfect fit, every time.",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    description:
      "We deliver across all 36 states and the FCT. Your order arrives at your doorstep, carefully packaged.",
  },
]

export function TrustBadges() {
  return (
    <section className="py-16 lg:py-20 bg-cream border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="group flex flex-col items-center text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-gold/20">
                <badge.icon className="h-7 w-7 text-primary transition-colors group-hover:text-accent" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-primary">
                {badge.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
