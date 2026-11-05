export function formatCourseDuration(minutes) {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 30) return `${hours}.5 hours`;
    const wholeHours = `${hours} ${hours === 1 ? "hour" : "hours"}`;
    if (remainingMinutes === 0) return wholeHours;
    return `${wholeHours} ${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`;
}
