export function isLocalhost(requestHeaders) {
  const host = requestHeaders.get("host");
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  return Boolean(host && /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)
    && (!forwardedHost || forwardedHost === host));
}
