import { config } from "dotenv";

// Local operational scripts follow Next.js's ignored .env.local convention.
// Existing process variables retain precedence in CI and hosted environments.
config({ path: ".env.local", override: false, quiet: true });
