import { Context } from "hono";

export const activityPubStatusAPIProvider = async (c: Context) => {
  return c.json({});
}