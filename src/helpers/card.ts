import { calculateTimeLeftString } from './pollTime';

/* Renders card for polls and non-Twitter video embeds (i.e. YouTube) */
export const renderCard = (
  card: GraphQLTwitterStatus['card']
): { poll?: APIPoll; external_media?: APIExternalMedia } => {
  if (!Array.isArray(card.legacy?.binding_values)) {
    return {};
  }

  const binding_values: Record<string, { string_value?: string; boolean_value?: boolean }> = {};

  card.legacy.binding_values.forEach(value => {
    if (value.key && value.value) {
      binding_values[value.key] = value.value;
    }
  });

  console.log('rendering card');

  if (binding_values.choice1_count?.string_value) {
    const choices: { [label: string]: number } = {};
    for (let i = 1; i <= 4; i++) {
      choices[binding_values[`choice${i}_label`]?.string_value || ''] = parseInt(
        binding_values[`choice${i}_count`]?.string_value || '0'
      );
    }

    const total_votes = Object.values(choices).reduce((a, b) => a + b, 0);

    return {
      poll: {
        ends_at: binding_values.end_datetime_utc?.string_value || '',
        time_left_en: calculateTimeLeftString(
          new Date(binding_values.end_datetime_utc?.string_value || '')
        ),
        total_votes,
        choices: Object.keys(choices)
          .filter(label => label !== '')
          .map(label => ({
            label: label,
            count: choices[label],
            percentage: (Math.round((choices[label] / total_votes) * 1000) || 0) / 10
          }))
      }
    };
  }

  if (binding_values.player_url?.string_value) {
    /* Oh good, a non-Twitter video URL! This enables YouTube embeds and stuff to just work */
    return {
      external_media: {
        type: 'video',
        url: binding_values.player_url.string_value,
        width: parseInt((binding_values.player_width?.string_value || '1280').replace('px', '')), // TODO: Replacing px might not be necessary, it's just there as a precaution
        height: parseInt((binding_values.player_height?.string_value || '720').replace('px', ''))
      }
    };
  }

  return {};
};
