import { calculateTimeLeftString } from './pollTime';

/* Renders card for polls and non-Twitter video embeds (i.e. YouTube) */
export const renderCard = async (
  card: TweetCard
): Promise<{ poll?: APIPoll; external_media?: APIExternalMedia }> => {
  const values = card.binding_values;

  console.log('rendering card');

  if (typeof values !== 'undefined') {
    if (typeof values.choice1_count !== 'undefined') {
      const poll = {} as APIPoll;

      if (typeof values.end_datetime_utc !== 'undefined') {
        poll.ends_at = values.end_datetime_utc.string_value || '';
        poll.time_left_en = calculateTimeLeftString(new Date(values.end_datetime_utc.string_value));
      }

      const choices: { [label: string]: number } = {
        [values.choice1_label?.string_value || '']: parseInt(values.choice1_count?.string_value || '0'),
        [values.choice2_label?.string_value || '']: parseInt(values.choice2_count?.string_value || '0'),
        [values.choice3_label?.string_value || '']: parseInt(values.choice3_count?.string_value || '0'),
        [values.choice4_label?.string_value || '']: parseInt(values.choice4_count?.string_value || '0')
      }

      poll.total_votes = Object.values(choices).reduce((a, b) => a + b, 0);

      poll.choices = Object.keys(choices).filter(label => label !== '').map(label => {
        return {
          label: label,
          count: choices[label],
          percentage: (Math.round((choices[label] / poll.total_votes) * 1000) || 0) / 10 || 0
        };
      });

      return { poll: poll };
    } else if (typeof values.player_url !== 'undefined') {
      /* Oh good, a non-Twitter video URL! This enables YouTube embeds and stuff to just work */
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
