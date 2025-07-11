"use client"

import { PrivacyPolicyPage } from "@/components/privacy-policy-page"
import { Toaster } from "@/components/ui/toaster"

export default function PolicyPage() {
  const handleNavigate = () => {
    // Redirigir a la página principal
    window.location.href = "/"
  }

  return (
    <>
      <PrivacyPolicyPage onNavigate={handleNavigate} />
      <Toaster />
    </>
  )
}
