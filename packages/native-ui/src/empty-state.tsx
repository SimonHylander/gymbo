import { Text, View } from "react-native"

export type EmptyStateProps = {
  title: string
  description?: string
  className?: string
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <View className={`items-center gap-1 py-16 ${className ?? ""}`}>
      <Text className="text-base font-medium text-neutral-600">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-neutral-400">
          {description}
        </Text>
      ) : null}
    </View>
  )
}
