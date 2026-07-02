import { describe, expect, it } from "vitest"

import { filterTools } from "../types"
import type { ToolMetadata } from "../../tool"

const makeMetadata = (name: string): ToolMetadata => ({
  name,
  description: name,
  inputSchema: {
    dialect: "draft-2020-12",
    schema: {},
    definitions: {},
  },
})

describe("filterTools", () => {
  it("applies include before exclude without mutating metadata", () => {
    const tools = [
      makeMetadata("one"),
      makeMetadata("two"),
      makeMetadata("three"),
    ]
    const result = filterTools(tools, {
      include: ["one", "two"],
      exclude: ["two"],
    })

    expect(result.map((item) => item.name)).toEqual(["one"])
    expect(tools.map((item) => item.name)).toEqual(["one", "two", "three"])
  })
})
