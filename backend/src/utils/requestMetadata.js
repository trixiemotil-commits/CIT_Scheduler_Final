function getRequestIp(req) {
  const forwarded = String(
    req.headers["cf-connecting-ip"]
      || req.headers["x-real-ip"]
      || req.headers["x-forwarded-for"]
      || ""
  )
    .split(",")[0]
    .trim();
  const address = forwarded || req.ip || req.socket?.remoteAddress || "";
  return String(address).replace(/^::ffff:/, "").slice(0, 100);
}

function getDeviceDescription(req) {
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 500);
  if (!userAgent) return "Unknown device";

  const device = /ipad|tablet|kindle|silk/i.test(userAgent)
    ? "Tablet"
    : /android|iphone|ipod|mobile/i.test(userAgent)
      ? "Mobile"
      : "Desktop";

  const os = /android/i.test(userAgent)
    ? "Android"
    : /iphone|ipad|ipod/i.test(userAgent)
      ? "iOS"
      : /windows/i.test(userAgent)
        ? "Windows"
        : /mac os|macintosh/i.test(userAgent)
          ? "macOS"
          : /linux/i.test(userAgent)
            ? "Linux"
            : "";

  const browser = /edg\//i.test(userAgent)
    ? "Edge"
    : /chrome|crios/i.test(userAgent)
      ? "Chrome"
      : /firefox|fxios/i.test(userAgent)
        ? "Firefox"
        : /safari/i.test(userAgent)
          ? "Safari"
          : "";

  return [device, os, browser].filter(Boolean).join(" / ").slice(0, 200);
}

module.exports = { getRequestIp, getDeviceDescription };
