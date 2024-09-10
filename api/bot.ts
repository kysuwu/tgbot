import { webhookCallback } from "grammy";

import { bot } from "../common/bot";

export default webhookCallback(bot, "http");