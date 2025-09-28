'use client'

import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"

export default function ToasterWrapper() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <Toaster />
}