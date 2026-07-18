import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import type { ExercisePickerViewProps } from "@/features/routines/ui/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ExercisePickerView({
  options,
  isLoading,
  onSelect,
  onSearchChange,
  search,
}: ExercisePickerViewProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 justify-between gap-2">
          Add exercise
          <ChevronsUpDownIcon className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search exercises…"
            value={search}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading…</CommandEmpty>
            ) : options.length === 0 ? (
              <CommandEmpty>No exercises found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((item) => (
                  <CommandItem
                    key={item.externalId}
                    value={item.externalId}
                    onSelect={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon className={cn("mr-2 size-3.5 opacity-0")} />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
