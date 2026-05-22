import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Chidinma Okafor",
    location: "Lagos",
    rating: 5,
    text: "My Aso-Oke set for my traditional wedding was absolutely stunning. The craftsmanship was impeccable and it fit perfectly. Everyone kept asking where I got it!",
    initials: "CO",
  },
  {
    name: "Emeka Nwankwo",
    location: "Abuja",
    rating: 5,
    text: "I ordered an Agbada for a friend's wedding and the quality exceeded my expectations. The embroidery detail was incredible and delivery was fast. Highly recommend!",
    initials: "EN",
  },
  {
    name: "Aisha Bello",
    location: "Kano",
    rating: 5,
    text: "Jhaz-Imprints made the most beautiful Kaftan for my husband. The fabric quality is top-notch and the customization options let us get exactly what we wanted.",
    initials: "AB",
  },
  {
    name: "Oluwaseun Adeyemi",
    location: "Ibadan",
    rating: 5,
    text: "I have ordered three outfits so far and each one has been perfect. Their attention to measurements means I never need alterations. Truly premium quality.",
    initials: "OA",
  },
  {
    name: "Ngozi Eze",
    location: "Port Harcourt",
    rating: 5,
    text: "The Ankara dress I got was a show-stopper at my sister's engagement. The fit was perfect and the fabric was the best quality I have seen. Will definitely order again!",
    initials: "NE",
  },
  {
    name: "Tunde Bakare",
    location: "Enugu",
    rating: 5,
    text: "Outstanding service from start to finish. The Babariga I ordered had the most beautiful embroidery. It felt like a truly bespoke luxury experience.",
    initials: "TB",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Happy Customers
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-5xl font-[family-name:var(--font-playfair)] text-balance">
            What Our Customers Say
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Join thousands of satisfied customers who trust Jhaz-Imprints for
            their traditional attire.
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:shadow-lg hover:border-gold/30"
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-gold/30" />

              {/* Stars */}
              <div className="mt-3 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent text-accent"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                {`"${t.text}"`}
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
