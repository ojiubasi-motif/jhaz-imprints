# Order Flow Domain Deep Dive

The Order Flow domain handles the multi-step custom tailoring and measurement submission process.

## Patterns and Conventions

- **State Management**: The entire flow's state is lifted to a parent component `OrderFlow` using `useState`. This parent component maintains a single `OrderData` object.
- **Step Components**: Each step in the wizard is extracted into its own component (e.g., `step-measurements.tsx`, `step-delivery.tsx`).
- **Props Interface**: The parent passes down the specific slice of state and update callbacks (like `onUpdateMeasurements` or `onNext`) to the child step components.
- **Types**: All data structures are strictly typed in `lib/order-types.ts`.

## Real Code Example

From `apps/user/components/order/order-flow.tsx`:
```tsx
"use client"

import { useState } from "react"
import { OrderProgressBar } from "@/components/order/order-progress-bar"
import { StyleSelection } from "@/components/order/step-style-selection"
// ...other imports
import { type OrderData, type OutfitStyle } from "@/lib/order-types"

export function OrderFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [orderData, setOrderData] = useState<OrderData>({
    style: null,
    // ...other fields
  })

  const goToStep = (step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNext = () => goToStep(currentStep + 1)

  const updateOrderData = <K extends keyof OrderData>(
    key: K,
    value: OrderData[K]
  ) => {
    setOrderData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    // ...
    {currentStep === 1 && (
      <StyleSelection
        selectedStyle={orderData.style}
        onSelectStyle={(style: OutfitStyle) => updateOrderData("style", style)}
        onNext={handleNext}
      />
    )}
    // ...
  )
}
```
