import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2020",
  clean: true,
  // Explicit banner rather than relying on tsup auto-detecting a shebang
  // line in the source — this is the one thing in this file I'd want
  // confirmed by an actual build rather than assumed to work.
  banner: { js: "#!/usr/bin/env node" },
});