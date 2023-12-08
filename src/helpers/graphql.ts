export const isGraphQLTwitterStatusNotFoundResponse = (
  response: unknown
): response is GraphQLTwitterStatusNotFoundResponse => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'errors' in response &&
    Array.isArray(response.errors) &&
    response.errors.length > 0 &&
    'message' in response.errors[0] &&
    response.errors[0].message === '_Missing: No status found with that ID'
  );
};

export const isGraphQLTwitterStatus = (response: unknown): response is GraphQLTwitterStatus => {
  return (
    typeof response === 'object' &&
    response !== null &&
    (('__typename' in response &&
      (response.__typename === 'Tweet' || response.__typename === 'TweetWithVisibilityResults')) ||
      typeof (response as GraphQLTwitterStatus).legacy?.full_text === 'string')
  );
};
