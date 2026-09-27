import { Command } from "commander";

import { registerCreatePolicyCommand } from "./commands/createPolicy.js";
import { registerPauseCommands } from "./commands/pause.js";
import { registerPullCommand } from "./commands/pull.js";
import { registerShowCommand } from "./commands/show.js";
import { registerUpdatePolicyCommand } from "./commands/updatePolicy.js";

const program = new Command();

program
  .name("shugo")
  .description("CLI for Shugo — a policy guardrail layer for Solana's Subscriptions & Allowances program")
  .version("0.1.0");

registerCreatePolicyCommand(program);
registerPauseCommands(program);
registerUpdatePolicyCommand(program);
registerPullCommand(program);
registerShowCommand(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(`Error: ${(err as Error).message}`);
  process.exitCode = 1;
});