import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { FeaturedStyles } from "@/components/featured-styles"
import { FabricShowcase } from "@/components/fabric-showcase"
import { TrustBadges } from "@/components/trust-badges"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedStyles />
        <FabricShowcase />
        <TrustBadges />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}
