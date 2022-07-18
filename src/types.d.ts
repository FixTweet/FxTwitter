/* tweetTypes has all the Twitter API-related types */

type InputFlags = {
  standard?: boolean;
  direct?: boolean;
};

interface StatusResponse {
  text?: string;
  response?: Response;
}