"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialYear, getFinancialYears, getCurrentFinancialYear, getAllTimeRange } from "@/lib/financial-year-utils";
import { CalendarRange } from "lucide-react";

interface FYSelectorProps {
    value: FinancialYear;
    onValueChange: (fy: FinancialYear) => void;
}

export function FYSelector({ value, onValueChange }: FYSelectorProps) {
    const financialYears = getFinancialYears(4);
    const allTime = getAllTimeRange();

    const options = [allTime, ...financialYears];

    return (
        <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-indigo-500" />
            <Select
                value={value.label}
                onValueChange={(label) => {
                    const selected = options.find(o => o.label === label);
                    if (selected) onValueChange(selected);
                }}
            >
                <SelectTrigger className="w-[140px] h-9 bg-white border-indigo-100 focus:ring-indigo-200 text-sm font-medium">
                    <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                    {options.map((fy) => (
                        <SelectItem key={fy.label} value={fy.label} className="text-sm">
                            {fy.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
