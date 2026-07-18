import { api } from "@workspace/backend/convex/_generated/api"
import { formatRepTargetLabel } from "@workspace/domain/lib/rep-target"
import { Badge } from "@workspace/native-ui/badge"
import { Button } from "@workspace/native-ui/button"
import { Card } from "@workspace/native-ui/card"
import { EmptyState } from "@workspace/native-ui/empty-state"
import { useQuery } from "convex/react"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { ActivityIndicator, FlatList, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const routine = useQuery(api.routines.getByExternalId, { externalId: id })
  const ongoingSession = useQuery(api.workouts.getOngoingForRoutine, {
    routineExternalId: id,
  })

  if (routine === undefined || ongoingSession === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  if (routine === null) {
    return <EmptyState title="Routine not found" />
  }

  const hasOngoing = ongoingSession !== null

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["bottom"]}>
      <Stack.Screen options={{ title: routine.name }} />
      <FlatList
        data={routine.exercises}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 gap-3 pb-28"
        ListHeaderComponent={
          hasOngoing ? (
            <Badge label="Workout in progress" tone="success" className="mb-1" />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="No exercises"
            description="Edit this routine on the web to add exercises."
          />
        }
        renderItem={({ item }) => {
          const repTarget = formatRepTargetLabel({
            reps: item.reps,
            repRangeMin: item.repRangeMin,
            repRangeMax: item.repRangeMax,
          })
          return (
            <Card>
              <Text className="text-base font-semibold text-neutral-900">
                {item.name}
              </Text>
              <Text className="mt-0.5 text-sm text-neutral-500">
                {item.sets.length} {item.sets.length === 1 ? "set" : "sets"}
                {repTarget ? ` · ${repTarget} reps` : ""}
                {item.restSeconds ? ` · ${item.restSeconds}s rest` : ""}
              </Text>
              {item.notes ? (
                <Text className="mt-1 text-sm italic text-neutral-400">
                  {item.notes}
                </Text>
              ) : null}
            </Card>
          )
        }}
      />
      <View className="absolute inset-x-4 bottom-4">
        <Button
          label={hasOngoing ? "Resume workout" : "Start workout"}
          onPress={() => router.push(`/routines/${id}/workout`)}
        />
      </View>
    </SafeAreaView>
  )
}
