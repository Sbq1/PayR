export async function register() {
  const required = ["AUTH_SECRET", "DATABASE_URL", "ENCRYPTION_KEY"];
  const missing = required.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `[Smart Checkout] Missing required environment variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env.local and fill in the values."
    );
  }
}
