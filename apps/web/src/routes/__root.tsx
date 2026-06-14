import { QueryClient } from "@tanstack/react-query"
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

import appCss from "@workspace/ui/globals.css?url"

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)"
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)"
const THEME_COLOR_SCRIPT = `(function(){var html=document.documentElement;var meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.setAttribute('name','theme-color');document.head.appendChild(meta)}function updateThemeColor(){var isDark=html.classList.contains('dark');meta.setAttribute('content',isDark?'${DARK_THEME_COLOR}':'${LIGHT_THEME_COLOR}')}var observer=new MutationObserver(updateThemeColor);observer.observe(html,{attributes:true,attributeFilter:['class']});updateThemeColor()})()`

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Gymbo Chat",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_COLOR_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <TooltipProvider>
            <Toaster
              position="top-center"
              theme="system"
              toastOptions={{
                className:
                  "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
              }}
            />
            {children}
            <Scripts />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
