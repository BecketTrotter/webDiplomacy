import { ParsedTime } from "../interfaces/ParsedTime";
import parseSeconds from "./parseSeconds";

export default function formatTime(time: ParsedTime, suffix: string): string {
  const availableTimeIntervals = Object.keys(time).filter((key) => time[key]);

  if (availableTimeIntervals.length > 1) {
    return `${time[availableTimeIntervals[0]]}${availableTimeIntervals[0]} ${
      time[availableTimeIntervals[1]]
    }${availableTimeIntervals[1]}${suffix}`;
  }
  if (availableTimeIntervals.length === 0) {
    return "Time Up";
  }

  return `${time[availableTimeIntervals[0]]}${
    availableTimeIntervals[0]
  }${suffix}`;
}

export function getFormattedTime(time: number) {
  const parsedTime = parseSeconds(time);
  return formatTime(parsedTime, "");
}

export function getFormattedTimeLeft(endTime: number) {
  const secondsLeft = endTime - +new Date() / 1000;
  const parsedTime = parseSeconds(secondsLeft);
  return formatTime(parsedTime, " remaining");
}
