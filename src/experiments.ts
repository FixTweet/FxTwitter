export enum Experiment {
  ELONGATOR_BY_DEFAULT = 'ELONGATOR_BY_DEFAULT'
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
  }
};

export const experimentCheck = (experiment: Experiment, condition = true) => {
  console.log(`Checking experiment ${experiment}`);
  const experimentEnabled =
    Experiments[experiment].percentage > Math.random() && condition;
  console.log(`Experiment ${experiment} enabled: ${experimentEnabled}`);
  return experimentEnabled;
};
