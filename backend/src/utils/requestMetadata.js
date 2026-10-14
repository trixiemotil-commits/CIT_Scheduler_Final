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

  const androidModel = userAgent.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build\/[^;)]+)?[;)]/i)?.[1]?.trim();
  let device = "Desktop";
  if (/ipad/i.test(userAgent)) device = "iPad";
  else if (/iphone/i.test(userAgent)) device = "iPhone";
  else if (/ipod/i.test(userAgent)) device = "iPod";
  else if (/cros/i.test(userAgent)) device = "Chromebook";
  else if (/android/i.test(userAgent)) {
    device = androidModel && !/^(?:wv|k|mobile|tablet)$/i.test(androidModel)
      ? androidModel
      : (/tablet|kindle|silk/i.test(userAgent) ? "Tablet" : "Mobile");
  } else if (/macintosh|mac os/i.test(userAgent)) device = "Mac";
  else if (/tablet|kindle|silk/i.test(userAgent)) device = "Tablet";
  else if (/mobile/i.test(userAgent)) device = "Mobile";

  let os = "";
  if (/cros/i.test(userAgent)) os = "ChromeOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
  else if (/windows/i.test(userAgent)) os = "Windows";
  else if (/mac os|macintosh/i.test(userAgent)) os = "macOS";
  else if (/linux/i.test(userAgent)) os = "Linux";

  let browser = "";
  if (/edg(?:e|a|ios)?\//i.test(userAgent)) browser = "Edge";
  else if (/opr\//i.test(userAgent)) browser = "Opera";
  else if (/samsungbrowser\//i.test(userAgent)) browser = "Samsung Internet";
  else if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent)) browser = "Safari";

  return [device, os, browser].filter(Boolean).join(" / ").slice(0, 200);
}

function getRequestLocation(req) {
  const city = String(req.headers["cf-ipcity"] || req.headers["x-vercel-ip-city"] || "").trim();
  const region = String(req.headers["x-vercel-ip-country-region"] || "").trim();
  const country = String(req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"] || "").trim();
  return [city, region, country].filter(Boolean).join(", ") || "Approximate location unavailable";
}

module.exports = { getRequestIp, getDeviceDescription, getRequestLocation };
