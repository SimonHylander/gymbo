import { View, type ViewProps } from "react-native"

export type CardProps = ViewProps & {
  className?: string
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl border border-neutral-200 bg-white p-4 ${className ?? ""}`}
      {...props}
    >
      {children}
    </View>
  )
}
