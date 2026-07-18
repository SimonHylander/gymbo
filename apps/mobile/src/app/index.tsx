import { api } from "@workspace/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import { Link } from "expo-router"
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

type RoutineRow = {
  externalId: string
  name: string
  exerciseCount: number
  hasOngoingWorkout: boolean
  programName: string | null
}

export default function RoutinesScreen() {
  const data = useQuery(api.programs.listWithRoutines)

  if (data === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  const rows: RoutineRow[] = [
    ...data.programs.flatMap((program) =>
      program.routines.map((routine) => ({
        ...routine,
        programName: program.name,
      }))
    ),
    ...data.unassignedRoutines.map((routine) => ({
      ...routine,
      programName: null,
    })),
  ]

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.externalId}
        contentContainerClassName="p-4 gap-3"
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-base text-neutral-500">
              No routines yet.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/routines/${item.externalId}`} asChild>
            <Pressable className="rounded-2xl border border-neutral-200 bg-white p-4 active:bg-neutral-50">
              <Text className="text-lg font-semibold text-neutral-900">
                {item.name}
              </Text>
              <Text className="mt-1 text-sm text-neutral-500">
                {item.exerciseCount}{" "}
                {item.exerciseCount === 1 ? "exercise" : "exercises"}
                {item.programName ? ` · ${item.programName}` : ""}
              </Text>
              {item.hasOngoingWorkout ? (
                <Text className="mt-1 text-sm font-medium text-emerald-600">
                  Workout in progress
                </Text>
              ) : null}
            </Pressable>
          </Link>
        )}
      />
      <View className="items-center pb-2">
        <Link href="/sign-in" className="text-sm text-neutral-400">
          Sign in
        </Link>
      </View>
    </SafeAreaView>
  )
}
