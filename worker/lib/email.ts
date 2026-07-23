export async function sendResetEmail(env: Env, to: string, resetToken: string): Promise<void> {
  if (!env.EMAIL) return;

  const resetUrl = `https://theobase.app/reset-password?token=${resetToken}`;

  try {
    await env.EMAIL.send({
      to,
      from: { email: "noreply@theobase.app", name: "Theobase" },
      subject: "Password Reset — Theobase",
      text: `A password reset was requested for your Theobase account.\n\nUse this link to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>A password reset was requested for your Theobase account.</p><p><a href="${resetUrl}">Reset your password</a> (expires in 1 hour).</p><p>If you did not request this, please ignore this email.</p>`,
    });
  } catch {
    // Email failure should not expose the reset token
  }
}
