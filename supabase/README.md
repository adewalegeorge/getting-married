# RSVP email notifications

When a guest submits the RSVP form, an email is sent to the couple via [Resend](https://resend.com) so they know instantly. The pipeline:

```
RSVP form (browser) -> Supabase rsvps table -> Database Webhook -> rsvp-notify Edge Function -> Resend API -> inbox
```

## One-time setup

### 1. Create a Resend account

1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails / month, more than enough)
2. Go to **API Keys** -> **Create API Key**, scope = "Sending access", save the `re_xxxx` key
3. (Optional, for branded sender) **Domains** -> add a domain you own and verify the DNS records. Skip this for now and use `onboarding@resend.dev` as the sender address.

### 2. Set the function secrets in Supabase

In the Supabase Dashboard -> **Edge Functions** -> **Manage secrets**:

| Key | Value |
|---|---|
| `RESEND_API_KEY` | `re_xxxx` from step 1 |
| `WEBHOOK_SECRET` | a long random string (e.g. `openssl rand -hex 32`) |
| `NOTIFY_TO` | `walleykool@gmail.com` (comma-separate to send to multiple) |
| `FROM_ADDRESS` | `onboarding@resend.dev` (or your verified domain sender) |

### 3. Deploy the function

```sh
# install Supabase CLI if needed
brew install supabase/tap/supabase

supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy rsvp-notify --no-verify-jwt
```

The `--no-verify-jwt` flag is important: the database webhook auths via the `WEBHOOK_SECRET`, not a JWT.

### 4. Create the database webhook

In Supabase Dashboard -> **Database** -> **Webhooks** -> **Create a new hook**:

- **Name**: `rsvp-notify`
- **Table**: `public.rsvps`
- **Events**: tick `Insert` only
- **Type**: `Supabase Edge Functions`
- **Edge Function**: `rsvp-notify`
- **HTTP Headers**:
  - `Authorization`: `Bearer <same WEBHOOK_SECRET as in step 2>`
- **HTTP Params**: leave empty
- **Timeout**: 5000

Save.

### 5. Test

Submit a test RSVP via the form (or insert a row via SQL). You should receive an email within a few seconds.

```sql
-- insert a test row
insert into rsvps (first_name, last_name, email, attending, relationship)
values ('Test', 'User', 'test@example.com', 'yes', 'colleague');
```

If nothing arrives:
- Check **Edge Functions -> Logs** in Supabase for errors
- Verify `RESEND_API_KEY` is set
- Check Resend's **Logs** dashboard for the email status

## Updating the email template

The HTML template lives in [`functions/rsvp-notify/index.ts`](functions/rsvp-notify/index.ts) inside `renderEmail()`. After editing, redeploy:

```sh
supabase functions deploy rsvp-notify --no-verify-jwt
```
