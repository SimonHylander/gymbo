import { Text, View } from "react-native"

type BadgeTone = "neutral" | "success" | "warning"

const toneClasses: Record<BadgeTone, { container: string; label: string }> = {
  neutral: { container: "bg-neutral-100", label: "text-neutral-600" },
  success: { container: "bg-emerald-100", label: "text-emerald-700" },
  warning: { container: "bg-amber-100", label: "text-amber-700" },
}

export type BadgeProps = {
  label: string
  tone?: BadgeTone
  className?: string
}

export function Badge({ label, tone = "neutral", className }: BadgeProps) {
  const classes = toneClasses[tone]
  return (
    <View
      className={`self-start rounded-full px-2.5 py-0.5 ${classes.container} ${className ?? ""}`}
    >
      <Text className={`text-xs font-medium ${classes.label}`}>{label}</Text>
    </View>
  )
}
