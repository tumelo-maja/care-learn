export const TRAINING_COUNTRIES = [
    { code: "ZM", label: "Track A" },
    { code: "ZA", label: "Track B" },
];
export function countryLabel(code) {
    return TRAINING_COUNTRIES.find((c) => c.code === code)?.label ?? null;
}
