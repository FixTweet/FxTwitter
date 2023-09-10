/* Helps create strings for polls! */

import { Strings } from '../strings';

export const calculateTimeLeft = (date: Date) => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
};

export const calculateTimeLeftString = (date: Date) => {
  const { days, hours, minutes, seconds } = calculateTimeLeft(date);
  const daysString =
    days > 0 ? `${days} ${days === 1 ? Strings.SINGULAR_DAY_LEFT : Strings.PLURAL_DAYS_LEFT}` : '';
  const hoursString =
    hours > 0
      ? `${hours} ${hours === 1 ? Strings.SINGULAR_HOUR_LEFT : Strings.PLURAL_HOURS_LEFT}`
      : '';
  const minutesString =
    minutes > 0
      ? `${minutes} ${minutes === 1 ? Strings.SINGULAR_MINUTE_LEFT : Strings.PLURAL_MINUTES_LEFT}`
      : '';
  const secondsString =
    seconds > 0
      ? `${seconds} ${seconds === 1 ? Strings.SINGULAR_SECOND_LEFT : Strings.PLURAL_SECONDS_LEFT}`
      : '';
  return daysString || hoursString || minutesString || secondsString || Strings.FINAL_POLL_RESULTS;
};
