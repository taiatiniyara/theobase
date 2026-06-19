# SMTP relay for outbound email

Outbound transactional email (magic links, duty reminders, notification
fallbacks) is sent via a dedicated micro VPS running a lightweight SMTP relay
connected to the Hostinger `messenger@theobase.net` account. The Cloudflare
Worker POSTs the email payload over HTTPS to the relay, which unwraps it and
delivers via Hostinger SMTP.

**Why:** Cloudflare Workers cannot make raw SMTP connections. Cloudflare Email
Routing handles inbound only. Third-party sending services (MailChannels, Resend)
add a recurring cost and an external dependency. A single $3–5/month VPS,
shared by all churches, keeps the outbound path self-hosted and cost-predictable
while using the existing Hostinger email subscription.

**Consequences:** The VPS is a single point of failure for outbound email. If it
goes down, magic link deliveries and duty reminders stop. Mitigation: the relay
is stateless (it proxies, it doesn't queue), so spinning up a replacement is a
matter of deploying the same Docker image to a new VPS. The relay exposes only
an HTTPS endpoint, authenticated with a pre-shared token, and listens only on a
Cloudflare Tunnel — no open SMTP ports to the internet.

**Rejected:** Resend or MailChannels (external dependency, recurring cost).
`cloudflare:sockets` direct SMTP from Workers (requires Workers Paid with TCP
support; the VPS is cheaper at this scale). Hostinger cPanel UAPI direct from
Workers (not available on all Hostinger plans).
