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
  const daysString = days > 0 ? `${days} ${days === 1 ? 'day left' : 'days left'}` : '';
  const hoursString =
    hours > 0 ? `${hours} ${hours === 1 ? 'hour left' : 'hours left'}` : '';
  const minutesString =
    minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute left' : 'minutes left'}` : '';
  const secondsString =
    seconds > 0 ? `${seconds} ${seconds === 1 ? 'second left' : 'seconds left'}` : '';
  return daysString || hoursString || minutesString || secondsString || 'Final results';
};

export const renderPoll = async (card: TweetCard, userAgent: string = ''): Promise<string> => {
  let str = '\n\n';
  const values = card.binding_values;

  console.log('rendering poll on ', card);

  // Telegram's bars need to be a lot smaller to fit its bubbles
  if (userAgent.indexOf('Telegram') > -1) {
    barLength = 24;
  }

  let choices: { [label: string]: number } = {};
  let totalVotes = 0;
  let timeLeft = '';

  if (typeof values !== 'undefined' && typeof values.end_datetime_utc !== 'undefined') {
    const date = new Date(values.end_datetime_utc.string_value);
    timeLeft = calculateTimeLeftString(date);
  }

  /* TODO: make this cleaner */
  if (
    typeof values !== 'undefined' &&
    typeof values.choice1_count !== 'undefined' &&
    typeof values.choice2_count !== 'undefined'
  ) {
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
      choices[values.choice4_label?.string_value || ''] = parseInt(
        values.choice4_count.string_value
      );
      totalVotes += parseInt(values.choice4_count.string_value);
    }
  } else {
    console.log('no choices found', values);
    return '';
  }
  console.log(choices);

  for (const [label, votes] of Object.entries(choices)) {
    // render bar
    const bar = '█'.repeat(Math.round((votes / totalVotes || 0) * barLength));
    str += `${bar}
${label}  (${Math.round((votes / totalVotes || 0) * 100)}%)
`;
  }

  str += `\n${totalVotes} votes · ${timeLeft}`;

  console.log(str);
  return str;
};
