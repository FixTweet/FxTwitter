import { Strings } from './strings';

let barLength = 36;

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
    days > 0
      ? `${days} ${days === 1 ? Strings.SINGULAR_DAY_LEFT : Strings.PLURAL_DAYS_LEFT}`
      : '';
  const hoursString =
    hours > 0
      ? `${hours} ${hours === 1 ? Strings.SINGULAR_HOUR_LEFT : Strings.PLURAL_HOURS_LEFT}`
      : '';
  const minutesString =
    minutes > 0
      ? `${minutes} ${
          minutes === 1 ? Strings.SINGULAR_MINUTE_LEFT : Strings.PLURAL_MINUTES_LEFT
        }`
      : '';
  const secondsString =
    seconds > 0
      ? `${seconds} ${
          seconds === 1 ? Strings.SINGULAR_SECOND_LEFT : Strings.PLURAL_SECONDS_LEFT
        }`
      : '';
  return (
    daysString ||
    hoursString ||
    minutesString ||
    secondsString ||
    Strings.FINAL_POLL_RESULTS
  );
};

export const renderCard = async (
  card: TweetCard
): Promise<{ poll?: APIPoll; external_media?: APIExternalMedia }> => {
  let str = '\n\n';
  const values = card.binding_values;

  console.log('rendering card on ', card);

  // Telegram's bars need to be a lot smaller to fit its bubbles
  let choices: { [label: string]: number } = {};
  let totalVotes = 0;
  let timeLeft = '';

  if (typeof values !== 'undefined') {
    /* TODO: make poll code cleaner */
    if (
      typeof values.choice1_count !== 'undefined' &&
      typeof values.choice2_count !== 'undefined'
    ) {
      let poll = {} as APIPoll;
      poll.ends_at = values.end_datetime_utc?.string_value || '';

      if (typeof values.end_datetime_utc !== 'undefined') {
        const date = new Date(values.end_datetime_utc.string_value);
        timeLeft = calculateTimeLeftString(date);
      }
      choices[values.choice1_label?.string_value || ''] = parseInt(
        values.choice1_count.string_value
      );
      totalVotes += parseInt(values.choice1_count.string_value);
      choices[values.choice2_label?.string_value || ''] = parseInt(
        values.choice2_count.string_value
      );
      totalVotes += parseInt(values.choice2_count.string_value);
      if (typeof values.choice3_count !== 'undefined') {
        choices[values.choice3_label?.string_value || ''] = parseInt(
          values.choice3_count.string_value
        );
        totalVotes += parseInt(values.choice3_count.string_value);
      }
      if (typeof values.choice4_count !== 'undefined') {
        choices[values.choice4_label?.string_value || ''] =
          parseInt(values.choice4_count.string_value) || 0;
        totalVotes += parseInt(values.choice4_count.string_value);
      }

      poll.total_votes = totalVotes;
      poll.choices = Object.keys(choices).map(label => {
        return {
          label: label,
          count: choices[label],
          percentage: (Math.round((choices[label] / totalVotes) * 1000) || 0) / 10 || 0
        };
      });

      return { poll: poll };
      /* Oh good, a non-Twitter video URL! This enables YouTube embeds and stuff to just work */
    } else if (typeof values.player_url !== 'undefined') {
      return {
        external_media: {
          type: 'video',
          url: values.player_url.string_value,
          width: parseInt(
            (values.player_width?.string_value || '1280').replace('px', '')
          ), // TODO: Replacing px might not be necessary, it's just there as a precaution
          height: parseInt(
            (values.player_height?.string_value || '720').replace('px', '')
          )
        }
      };
    }
  }
  return {};
};
