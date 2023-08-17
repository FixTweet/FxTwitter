import { calculateTimeLeftString } from './pollTime';

/* Renders card for polls and non-Twitter video embeds (i.e. YouTube) */
export const renderCard = (
  card: GraphQLTweet['card']
): { poll?: APIPoll; external_media?: APIExternalMedia } => {
  // We convert the binding_values array into an object with the legacy format
  // TODO Clean this up
  const binding_values: Record<
    string,
    { string_value?: string; boolean_value?: boolean }
  > = {};
  if (Array.isArray(card.legacy.binding_values)) {
    card.legacy.binding_values.forEach(value => {
      if (value.key && value.value) {
        binding_values[value.key] = value.value;
      }
    });
  }

  console.log('rendering card');

  if (typeof binding_values !== 'undefined') {
    if (typeof binding_values.choice1_count !== 'undefined') {
      const poll = {} as APIPoll;

      poll.ends_at = binding_values.end_datetime_utc?.string_value || '';
      poll.time_left_en = calculateTimeLeftString(
        new Date(binding_values.end_datetime_utc?.string_value || '')
      );

      const choices: { [label: string]: number } = {
        [binding_values.choice1_label?.string_value || '']: parseInt(
          binding_values.choice1_count?.string_value || '0'
        ),
        [binding_values.choice2_label?.string_value || '']: parseInt(
          binding_values.choice2_count?.string_value || '0'
        ),
        [binding_values.choice3_label?.string_value || '']: parseInt(
          binding_values.choice3_count?.string_value || '0'
        ),
        [binding_values.choice4_label?.string_value || '']: parseInt(
          binding_values.choice4_count?.string_value || '0'
        )
      };

      poll.total_votes = Object.values(choices).reduce((a, b) => a + b, 0);

      poll.choices = Object.keys(choices)
        .filter(label => label !== '')
        .map(label => {
          return {
            label: label,
            count: choices[label],
            percentage:
              (Math.round((choices[label] / poll.total_votes) * 1000) || 0) / 10 || 0
          };
        });

      return { poll: poll };
    } else if (
      typeof binding_values.player_url !== 'undefined' &&
      binding_values.player_url.string_value
    ) {
      /* Oh good, a non-Twitter video URL! This enables YouTube embeds and stuff to just work */
      return {
        external_media: {
          type: 'video',
          url: binding_values.player_url.string_value,
          width: parseInt(
            (binding_values.player_width?.string_value || '1280').replace('px', '')
          ), // TODO: Replacing px might not be necessary, it's just there as a precaution
          height: parseInt(
            (binding_values.player_height?.string_value || '720').replace('px', '')
          )
        }
      };
    }
  }
  return {};
};
