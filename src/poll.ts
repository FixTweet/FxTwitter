const barLength = 30;

export const renderPoll = async (card: TweetCard): Promise<string> => {
  let str = '\n\n';
  const values = card.binding_values;

  console.log('rendering poll on ', card);

  let choices: { [label: string]: number } = {};
  let totalVotes = 0;

  if (typeof values !== "undefined" && typeof values.choice1_count !== "undefined" && typeof values.choice2_count !== "undefined") {
    choices[values.choice1_label?.string_value || ''] = parseInt(values.choice1_count.string_value);
    totalVotes += parseInt(values.choice1_count.string_value);
    choices[values.choice2_label?.string_value || ''] = parseInt(values.choice2_count.string_value);
    totalVotes += parseInt(values.choice2_count.string_value);
    if (typeof values.choice3_count !== "undefined") {
      choices[values.choice3_label?.string_value || ''] = parseInt(values.choice3_count.string_value);
      totalVotes += parseInt(values.choice3_count.string_value);
    }
    if (typeof values.choice4_count !== "undefined") {
      choices[values.choice4_label?.string_value || ''] = parseInt(values.choice4_count.string_value);
      totalVotes += parseInt(values.choice4_count.string_value);
    }
  } else {
    console.log('no choices found', values);
  }
  console.log(choices);

  for (const [label, votes] of Object.entries(choices)) {
    // render bar
    const bar = '█'.repeat(Math.floor(votes / totalVotes * barLength));
    str += `${bar}
${label}  (${Math.floor(votes / totalVotes * 100)}%)
`;
  }

  str += `\n${totalVotes} votes`;

  console.log(str);
  return str;
}