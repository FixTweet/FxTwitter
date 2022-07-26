import { calculateTimeLeftString } from './pollHelper';

export const renderCard = async (
  card: TweetCard
): Promise<{ poll?: APIPoll; external_media?: APIExternalMedia }> => {
  const values = card.binding_values;

  console.log('rendering card on ', card);

  const choices: { [label: string]: number } = {};
  let totalVotes = 0;

  if (typeof values !== 'undefined') {
    /* TODO: make poll code cleaner */
    if (
      typeof values.choice1_count !== 'undefined' &&
      typeof values.choice2_count !== 'undefined'
    ) {
      const poll = {} as APIPoll;

      if (typeof values.end_datetime_utc !== 'undefined') {
        poll.ends_at = values.end_datetime_utc.string_value || '';

        const date = new Date(values.end_datetime_utc.string_value);
        poll.time_left_en = calculateTimeLeftString(date);
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
