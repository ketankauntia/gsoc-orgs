import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emails = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);

if (!url || !serviceRoleKey) throw new Error("Supabase service-role environment variables are required");
if (emails.length === 0) throw new Error("ADMIN_BOOTSTRAP_EMAILS must contain at least one email");

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
async function main() {
for (const email of emails) {
  const { error } = await supabase.rpc("bootstrap_admin", { target_email: email });
  if (error) throw new Error(`Could not bootstrap ${email}: ${error.message}`);
  console.log(`Bootstrapped admin: ${email}`);
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
