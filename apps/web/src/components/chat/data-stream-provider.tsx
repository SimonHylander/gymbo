"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DataUIPart } from "ai";
import type React from "react";
import type { CustomUIDataTypes } from "@/lib/types";

type DataStreamContextValue = {
  dataStream: Array<DataUIPart<CustomUIDataTypes>>;
  setDataStream: React.Dispatch<
    React.SetStateAction<Array<DataUIPart<CustomUIDataTypes>>>
  >;
};

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataStream, setDataStream] = useState<Array<DataUIPart<CustomUIDataTypes>>>(
    []
  );

  const value = useMemo(() => ({ dataStream, setDataStream }), [dataStream]);

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error("useDataStream must be used within a DataStreamProvider");
  }
  return context;
}
