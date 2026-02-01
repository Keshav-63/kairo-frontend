import type React from "react"
import "../src/index.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Kairo - AI Smart Pendant</title>
        <meta
          name="description"
          content="Kairo AI Smart Pendant - A Wearable Conversational Memory Assistant with AI-Based Recall"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
