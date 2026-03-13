/**
 * Utilities for Financial Year (FY) calculations
 * Standard Indian Financial Year: April 1st to March 31st
 */

export interface FinancialYear {
    label: string; // e.g., "FY 2023-24"
    startDate: string; // e.g., "2023-04-01"
    endDate: string; // e.g., "2024-03-31"
}

/**
 * Generates a list of common financial years
 * @param count Number of years to generate backwards from current
 */
export function getFinancialYears(count: number = 5): FinancialYear[] {
    const currentDetails = getCurrentFinancialYear();
    const currentYear = parseInt(currentDetails.startDate.split('-')[0]);

    const years: FinancialYear[] = [];

    for (let i = 0; i < count; i++) {
        const startYear = currentYear - i;
        const endYear = startYear + 1;
        const endYearShort = endYear.toString().slice(-2);

        years.push({
            label: `FY ${startYear}-${endYearShort}`,
            startDate: `${startYear}-04-01`,
            endDate: `${endYear}-03-31`
        });
    }

    return years;
}

/**
 * Calculates current financial year based on current date
 */
export function getCurrentFinancialYear(): FinancialYear {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed, April is 3
    const currentYear = now.getFullYear();

    let startYear = currentYear;
    if (currentMonth < 3) { // Jan, Feb, Mar belong to previous FY
        startYear = currentYear - 1;
    }

    const endYear = startYear + 1;
    const endYearShort = endYear.toString().slice(-2);

    return {
        label: `FY ${startYear}-${endYearShort}`,
        startDate: `${startYear}-04-01`,
        endDate: `${endYear}-03-31`
    };
}

/**
 * Returns a label and range for all-time data
 */
export function getAllTimeRange(): FinancialYear {
    return {
        label: "All Time",
        startDate: "",
        endDate: ""
    };
}
