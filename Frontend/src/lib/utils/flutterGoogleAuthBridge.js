/**
 * Flutter <-> Web bridge helper for Google Sign-In inside WebView.
 *
 * Expected Flutter handler:
 *   window.flutter_inappwebview.callHandler("nativeGoogleSignIn")
 * Should resolve to something like:
 *   { success: true, idToken: "..." }
 *
 * If the bridge is not present, we return a safe failure object.
 */

export function hasFlutterGoogleBridge() {
  return (
    typeof window !== "undefined" &&
    window.flutter_inappwebview &&
    typeof window.flutter_inappwebview.callHandler === "function"
  );
}

function pickFirstString(values = []) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "";
}

function normalizeFlutterGoogleResult(raw) {
  const obj = raw && typeof raw === "object" ? raw : {};
  const data = obj.data && typeof obj.data === "object" ? obj.data : {};
  const tokenObj = obj.token && typeof obj.token === "object" ? obj.token : {};

  const idToken = pickFirstString([
    obj.idToken,
    obj.id_token,
    obj.googleIdToken,
    obj.google_id_token,
    obj.token,
    data.idToken,
    data.id_token,
    data.googleIdToken,
    tokenObj.idToken,
    tokenObj.id_token,
  ]);

  const accessToken = pickFirstString([
    obj.accessToken,
    obj.access_token,
    data.accessToken,
    data.access_token,
    tokenObj.accessToken,
    tokenObj.access_token,
  ]);

  const cancelled =
    obj.cancelled === true ||
    obj.canceled === true ||
    obj.isCancelled === true ||
    obj.isCanceled === true ||
    obj.status === "cancelled" ||
    obj.status === "canceled" ||
    obj.message === "cancelled" ||
    obj.message === "canceled";

  const successSignal =
    obj.success === true ||
    obj.status === "success" ||
    obj.status === "ok" ||
    (obj.result && obj.result === "success");

  return {
    success: !!(successSignal || idToken || accessToken),
    idToken,
    accessToken,
    cancelled,
    raw: obj,
  };
}

export async function nativeGoogleSignIn() {
  if (!hasFlutterGoogleBridge()) {
    return { success: false, reason: "no_flutter_bridge" };
  }

  try {
    // Call with no args for maximum Flutter compatibility.
    // Flutter should open Google sign-in and resolve with idToken.
    const result = await window.flutter_inappwebview.callHandler(
      "nativeGoogleSignIn",
    );
    if (!result) return { success: false, reason: "empty_result" };
    return normalizeFlutterGoogleResult(result);
  } catch (error) {
    console.error("[FlutterGoogleAuthBridge] callHandler failed:", error);
    return { success: false, error };
  }
}

