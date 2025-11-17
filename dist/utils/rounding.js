export function floorToThousand(value) {
    if (!isFinite(value))
        return 0;
    return Math.floor(value / 1000) * 1000;
}
export function roundToYen(value) {
    if (!isFinite(value))
        return 0;
    return Math.round(value);
}
