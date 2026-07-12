export function isPayloadConfigured() {
  return Boolean(process.env.PAYLOAD_DATABASE_URL && process.env.PAYLOAD_SECRET);
}

export function PayloadNotConfigured() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif', lineHeight: 1.55 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Payload CMS is not configured</h1>
      <p style={{ maxWidth: 720 }}>
        Add <code>PAYLOAD_DATABASE_URL</code> and <code>PAYLOAD_SECRET</code> to your local
        environment, then run the CMS migration and seed commands before opening the admin panel.
      </p>
    </main>
  );
}
