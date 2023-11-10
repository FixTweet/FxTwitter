export enum Experiment {
  ELONGATOR_BY_DEFAULT = 'ELONGATOR_BY_DEFAULT',
  ELONGATOR_PROFILE_API = 'ELONGATOR_PROFILE_API',
  TWEET_DETAIL_API = 'TWEET_DETAIL_API'
}

type ExperimentConfig = {
  name: string;
  description: string;
  percentage: number;
};

const Experiments: { [key in Experiment]: ExperimentConfig } = {
  [Experiment.ELONGATOR_BY_DEFAULT]: {
    name: 'Elongator by default',
    description: 'Enable Elongator by default (guest token lockout bypass)',
    percentage: 1
  },
  [Experiment.ELONGATOR_PROFILE_API]: {
    name: 'Elongator profile API',
    description: 'Use Elongator to load profiles',
    percentage: 1
  },
  [Experiment.TWEET_DETAIL_API]: {
    name: 'Tweet detail API',
    description: 'Use Tweet Detail API (where available with elongator)',
    percentage: 0.5
  }
};

export const experimentCheck = (experiment: Experiment, condition = true) => {
  console.log(`Checking experiment ${experiment}`);
  const experimentEnabled = Experiments[experiment].percentage > Math.random() && condition;
  console.log(`Experiment ${experiment} enabled: ${experimentEnabled}`);
  return experimentEnabled;
};
