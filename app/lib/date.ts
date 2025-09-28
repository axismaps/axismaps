export function formatDate(
  date: string,
  options: {
    includeRelative?: boolean;
    dayMonth?: boolean;
  } = {}
): string {
  const currentDate = new Date();
  const inputDate = new Date(date);

  if (options.includeRelative) {
    const diffTime = currentDate.getTime() - inputDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    let relativeTime = "";
    if (diffYears > 0) {
      relativeTime = `${diffYears}y ago`;
    } else if (diffMonths > 0) {
      relativeTime = `${diffMonths}mo ago`;
    } else if (diffDays > 0) {
      relativeTime = `${diffDays}d ago`;
    } else {
      relativeTime = "today";
    }

    const fullDate = inputDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

    return `${fullDate} (${relativeTime})`;
  }

  if (options.dayMonth) {
    return inputDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  return inputDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}