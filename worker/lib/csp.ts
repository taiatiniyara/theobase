export function csp() {
  const POLICY =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://theobase.app;";

  return async (
    c: { env: Env; header: (name: string, value: string) => void },
    next: () => Promise<void>
  ): Promise<void> => {
    const headerName =
      c.env.CSP_REPORT_ONLY === "true"
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy";
    c.header(headerName, POLICY);
    await next();
  };
}
