import { ActivityIndicator, Pressable, Text } from "react-native"

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost"

const containerClasses: Record<ButtonVariant, string> = {
  primary: "bg-neutral-900 active:opacity-80",
  secondary: "bg-neutral-100 active:bg-neutral-200",
  destructive: "bg-red-600 active:opacity-80",
  ghost: "active:bg-neutral-100",
}

const labelClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-neutral-900",
  destructive: "text-white",
  ghost: "text-neutral-600",
}

export type ButtonProps = {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`flex-row items-center justify-center gap-2 rounded-xl px-5 py-3 ${
        containerClasses[variant]
      } ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "secondary" || variant === "ghost" ? "#171717" : "#ffffff"}
        />
      ) : null}
      <Text className={`text-base font-semibold ${labelClasses[variant]}`}>
        {label}
      </Text>
    </Pressable>
  )
}
