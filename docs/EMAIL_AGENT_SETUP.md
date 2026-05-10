# Email Agent Setup

The project now supports a local email-to-pilot bridge:

```text
Resend email.received webhook
  -> /api/inbound-email
  -> rfq-agent-piloto/inbox/{email-id}/
  -> rfq-agent-piloto local processor
  -> rfq-agent-piloto/salidas/
  -> dashboard /dashboard/rfqs
```

## What The Webhook Does

- Verifies the Resend/Svix webhook signature.
- Downloads the full received email through Resend Receiving.
- Downloads allowed drawing attachments: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.step`, `.stp`, `.dxf`.
- Creates a local RFQ input folder with `email.txt`, drawings and `config-taller.json`.
- Starts the local pilot in the background.
- Does not send any customer-facing email.

## Required Environment

Root `.env.local` needs:

```text
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...
RFQ_INBOUND_PROVIDER=mock
```

`RESEND_API_KEY` must be able to access Receiving emails and attachments. A send-only key will make the webhook fail with:

```text
This API key is restricted to only send emails
```

Optional:

```text
RFQ_INBOUND_PROVIDER=gemini
RFQ_INBOUND_CONFIG_PATH=C:\ruta\a\config-taller.json
ALLOW_UNVERIFIED_RESEND_WEBHOOKS=true
```

Use `ALLOW_UNVERIFIED_RESEND_WEBHOOKS=true` only for local manual tests, never in production.

## Resend Dashboard Steps

1. Open Resend Receiving.
2. Use the managed `.resend.app` receiving domain or configure a dedicated subdomain.
3. Add a webhook with event `email.received`.
4. Point it to:

```text
https://YOUR_PUBLIC_TUNNEL/api/inbound-email
```

For local tests, expose `http://localhost:3000` with ngrok or VS Code Port Forwarding.

## Test

### Test Without Resend

Use this first to prove that the local autonomous bridge works:

1. Start the app:

```powershell
npm.cmd run dev
```

2. Open:

```text
http://localhost:3000/dashboard/rfqs
```

3. Click `Simular email entrante`.
4. Wait a few seconds and click `Refrescar RFQs`.

This creates a test folder in `rfq-agent-piloto/inbox/`, starts the pilot, and writes the result into `rfq-agent-piloto/salidas/`.

### Test With Resend

1. Start the app:

```powershell
npm.cmd run dev
```

2. Send an email with a drawing attachment to the Resend receiving address.
3. Watch for a new folder under:

```text
rfq-agent-piloto/inbox/
```

4. After processing, open:

```text
http://localhost:3000/dashboard/rfqs
```

## Direct Links

- Resend Receiving: https://resend.com/emails/receiving
- Resend Webhooks: https://resend.com/webhooks
- Resend API Keys: https://resend.com/api-keys
- Resend Domains: https://resend.com/domains
- ngrok: https://ngrok.com/download
- VS Code Port Forwarding: https://code.visualstudio.com/docs/debugtest/port-forwarding
- Resend Receiving docs: https://resend.com/docs/dashboard/receiving/introduction
- Resend attachment docs: https://resend.com/docs/dashboard/receiving/attachments
