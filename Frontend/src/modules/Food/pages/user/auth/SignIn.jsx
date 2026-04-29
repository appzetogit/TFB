import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle, Check, ChevronDown, Loader2, Mail } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { authAPI } from "@food/api"
import { setAuthData as setUserAuthData } from "@food/utils/auth"
import { getFirebaseAuth, getGoogleAuthProvider } from "@food/firebase"
import { toast } from "sonner"
import logoNew from "@food/assets/logo.png"

const REMEMBER_LOGIN_KEY = "user_login_phone"
const BRAND_MAROON = "#922727"
const INPUT_BORDER = "#d9d1c8"
const INPUT_TEXT = "#8f5a28"
const APPLE_SDK_SRC = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
const APPLE_CLIENT_ID_FALLBACK = import.meta.env.VITE_APPLE_CLIENT_ID || ""
const APPLE_REDIRECT_URI_FALLBACK =
  import.meta.env.VITE_APPLE_USER_REDIRECT_URI || import.meta.env.VITE_APPLE_REDIRECT_URI || ""
const headingWords = ["India's", "#1", "Food", "Delivery", "and", "Dining", "App"]

const sanitizeConfigValue = (value) => (value ? String(value).trim() : "")

const loadAppleSdk = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Apple sign-in is only available in the browser"))
      return
    }

    if (window.AppleID?.auth) {
      resolve(window.AppleID)
      return
    }

    const existingScript = document.querySelector(`script[src="${APPLE_SDK_SRC}"]`)
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.AppleID), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Apple sign-in SDK")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = APPLE_SDK_SRC
    script.async = true
    script.onload = () => resolve(window.AppleID)
    script.onerror = () => reject(new Error("Failed to load Apple sign-in SDK"))
    document.head.appendChild(script)
  })

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <path
        fill="#EA4335"
        d="M12.24 10.286v3.821h5.414c-.233 1.229-.932 2.271-1.98 2.972l3.2 2.482c1.864-1.718 2.938-4.248 2.938-7.261 0-.699-.063-1.372-.179-2.014z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.619-2.439l-3.2-2.482c-.895.6-2.034.958-3.419.958-2.622 0-4.847-1.77-5.64-4.152H3.057v2.56A9.997 9.997 0 0 0 12 22"
      />
      <path
        fill="#4A90E2"
        d="M6.36 13.885a5.998 5.998 0 0 1 0-3.77v-2.56H3.057a10.001 10.001 0 0 0 0 8.89z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.964c1.469 0 2.788.505 3.826 1.498l2.867-2.867C16.959 2.979 14.694 2 12 2a9.997 9.997 0 0 0-8.943 5.555l3.303 2.56C7.153 7.733 9.378 5.964 12 5.964"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M16.365 12.71c.026 2.824 2.48 3.764 2.507 3.777-.021.066-.389 1.336-1.28 2.648-.771 1.135-1.57 2.266-2.83 2.289-1.237.023-1.635-.734-3.048-.734-1.412 0-1.855.711-3.026.758-1.216.046-2.142-1.218-2.919-2.349-1.587-2.295-2.8-6.486-1.172-9.31.808-1.403 2.252-2.289 3.817-2.312 1.193-.023 2.319.804 3.048.804.728 0 2.097-.994 3.535-.848.602.025 2.292.242 3.377 1.83-.088.055-2.014 1.176-1.989 3.447Zm-2.829-6.562c.647-.785 1.083-1.875.964-2.963-.932.037-2.06.621-2.729 1.406-.6.697-1.125 1.809-.982 2.873 1.039.08 2.1-.529 2.747-1.316Z" />
    </svg>
  )
}

function SocialButton({ children, onClick, disabled = false, className = "", style, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={style}
      className={`flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  )
}

export default function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91",
  })
  const [rememberLogin, setRememberLogin] = useState(true)
  const [phoneError, setPhoneError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAppleLoading, setIsAppleLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    const storedPhone = localStorage.getItem(REMEMBER_LOGIN_KEY) || ""
    if (storedPhone) {
      setFormData((prev) => ({ ...prev, phone: storedPhone }))
      setRememberLogin(true)
      return
    }

    const stored = sessionStorage.getItem("userAuthData")
    if (!stored) return

    try {
      const data = JSON.parse(stored)
      const fullPhone = String(data.phone || "").trim()
      const phoneDigits = fullPhone.replace(/^\+91\s*/, "").replace(/\D/g, "").slice(0, 10)
      setFormData((prev) => ({
        ...prev,
        phone: phoneDigits || prev.phone,
      }))
    } catch {
      // Ignore invalid session data and keep the form empty.
    }
  }, [])

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Phone number is required"
    const cleanPhone = phone.replace(/\D/g, "")
    if (!/^\d{10}$/.test(cleanPhone)) return "Phone number must be exactly 10 digits"
    return ""
  }

  const handleChange = (e) => {
    const { name } = e.target
    let { value } = e.target

    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10)
      setPhoneError(validatePhone(value))
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const currentPhoneError = validatePhone(formData.phone)
    setPhoneError(currentPhoneError)
    if (currentPhoneError) return
    if (submittingRef.current) return

    submittingRef.current = true
    setIsLoading(true)
    setPhoneError("")

    try {
      const countryCode = formData.countryCode?.trim() || "+91"
      const phoneDigits = String(formData.phone ?? "").replace(/\D/g, "").slice(0, 10)
      const fullPhone = `${countryCode} ${phoneDigits}`

      await authAPI.sendOTP(fullPhone, "login", null)

      if (rememberLogin) {
        localStorage.setItem(REMEMBER_LOGIN_KEY, phoneDigits)
      } else {
        localStorage.removeItem(REMEMBER_LOGIN_KEY)
      }

      const ref = String(searchParams.get("ref") || "").trim()
      const authData = {
        method: "phone",
        phone: fullPhone,
        email: null,
        name: null,
        referralCode: ref || null,
        isSignUp: false,
        module: "user",
      }

      sessionStorage.setItem("userAuthData", JSON.stringify(authData))
      navigate("/user/auth/otp")
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.error ||
        "Failed to send OTP. Please try again."
      setPhoneError(message)
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  const handleAppleSignIn = async () => {
    if (isAppleLoading) return

    setIsAppleLoading(true)

    try {
      const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "")
      const configResponse = await fetch(`${apiBaseUrl}/food/public/env`).catch(() => null)
      const configPayload = await configResponse?.json().catch(() => ({}))
      const publicConfig = configPayload?.data || {}
      const clientId = sanitizeConfigValue(
        publicConfig.APPLE_CLIENT_ID || publicConfig.VITE_APPLE_CLIENT_ID || APPLE_CLIENT_ID_FALLBACK
      )
      const redirectURI = sanitizeConfigValue(
        publicConfig.APPLE_USER_REDIRECT_URI ||
          publicConfig.VITE_APPLE_USER_REDIRECT_URI ||
          publicConfig.APPLE_REDIRECT_URI ||
          publicConfig.VITE_APPLE_REDIRECT_URI ||
          APPLE_REDIRECT_URI_FALLBACK
      )

      if (!clientId || !redirectURI) {
        throw new Error("Apple sign-in is not configured yet")
      }

      await loadAppleSdk()

      if (!window.AppleID?.auth) {
        throw new Error("Apple sign-in SDK is unavailable")
      }

      const state = `apple_user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      sessionStorage.setItem("appleAuthState", state)

      window.AppleID.auth.init({
        clientId,
        scope: "name email",
        redirectURI,
        state,
        usePopup: false,
      })

      await window.AppleID.auth.signIn()
    } catch (providerError) {
      const message = providerError?.message || "Apple sign-in could not be started. Please try again."
      toast.error(message)
      setIsAppleLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return

    setIsGoogleLoading(true)

    try {
      const [{ signInWithPopup }, firebaseAuth, googleProvider] = await Promise.all([
        import("firebase/auth"),
        Promise.resolve(getFirebaseAuth()),
        Promise.resolve(getGoogleAuthProvider()),
      ])

      googleProvider.setCustomParameters({ prompt: "select_account" })

      let fcmToken = null
      let platform = "web"
      try {
        if (typeof window !== "undefined") {
          if (window.flutter_inappwebview) {
            platform = "mobile"
            const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"]
            for (const handlerName of handlerNames) {
              try {
                const nativeToken = await window.flutter_inappwebview.callHandler(handlerName, { module: "user" })
                if (nativeToken && typeof nativeToken === "string" && nativeToken.length > 20) {
                  fcmToken = nativeToken.trim()
                  break
                }
              } catch {
                // Try the next bridge handler.
              }
            }
          } else {
            fcmToken = localStorage.getItem("fcm_web_registered_token_user") || null
          }
        }
      } catch {
        // Ignore FCM token collection errors during auth.
      }

      const firebaseResult = await signInWithPopup(firebaseAuth, googleProvider)
      const idToken = await firebaseResult.user.getIdToken()
      const response = await authAPI.loginWithGoogle(idToken, fcmToken, platform)
      const data = response?.data?.data || response?.data || {}
      const accessToken = data.accessToken
      const refreshToken = data.refreshToken ?? null
      const user = data.user

      if (!accessToken || !refreshToken || !user) {
        throw new Error("Invalid response from server")
      }

      sessionStorage.removeItem("userAuthData")
      setUserAuthData("user", accessToken, user, refreshToken)
      window.dispatchEvent(new Event("userAuthChanged"))
      navigate("/user")
    } catch (providerError) {
      const message =
        providerError?.response?.data?.message ||
        providerError?.response?.data?.error ||
        providerError?.message ||
        "Google sign-in failed. Please try again."
      toast.error(message)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleEmailSignIn = () => {
    toast.message("Email sign-in will be added on this screen soon.")
  }

  return (
    <AnimatedPage className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white px-8 pt-20 pb-0">
        <div className="flex flex-1 flex-col">
          <div className="pt-4 text-center">
            <img
              src={logoNew}
              alt="Tifunbox"
              className="mx-auto h-auto w-full max-w-[320px] object-contain"
            />
          </div>

          <div className="mt-16 text-center">
            <h1 className="mx-auto max-w-[325px] text-[2.05rem] font-semibold leading-[1.15] tracking-[-0.035em] text-black">
              {headingWords.map((word, index) => (
                <span key={`${word}-${index}`} className="mr-[0.28em] inline-block last:mr-0">
                  {word}
                </span>
              ))}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-10">
            <div className="flex items-stretch gap-3">
              <button
                type="button"
                className="flex h-14 w-[102px] shrink-0 items-center justify-between rounded-[1.1rem] border bg-white px-4 text-[1rem] font-semibold text-[#2b211a]"
                style={{ borderColor: INPUT_BORDER }}
              >
                <span className="flex items-center gap-2">
                  <span>IN</span>
                  <span className="font-medium text-[#6d665f]">+91</span>
                </span>
                <ChevronDown className="h-4 w-4 text-[#8a847d]" />
              </button>

              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="7610416911"
                value={formData.phone}
                onChange={handleChange}
                aria-invalid={phoneError ? "true" : "false"}
                className="h-14 flex-1 rounded-[1.1rem] border bg-white px-4 text-[1rem] font-medium focus-visible:ring-0"
                style={{
                  borderColor: phoneError ? "#ef4444" : INPUT_BORDER,
                  color: INPUT_TEXT,
                  boxShadow: "none",
                }}
              />
            </div>

            {phoneError ? (
              <div className="mt-3 flex items-center gap-1.5 pl-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{phoneError}</span>
              </div>
            ) : null}

            <label className="mt-5 flex cursor-pointer items-center gap-3 text-[0.98rem] text-[#3f372f]">
              <input
                type="checkbox"
                checked={rememberLogin}
                onChange={(e) => setRememberLogin(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                  rememberLogin ? "text-white" : "border bg-white text-transparent"
                }`}
                style={{
                  backgroundColor: rememberLogin ? BRAND_MAROON : "#ffffff",
                  borderColor: rememberLogin ? BRAND_MAROON : INPUT_BORDER,
                }}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span>Remember my login for faster sign-in</span>
            </label>

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-7 h-14 w-full rounded-[1.1rem] text-lg font-bold text-white transition-all hover:opacity-95 active:scale-[0.99]"
              style={{ backgroundColor: BRAND_MAROON }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>

          <div className="mt-9">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[#d8d1cb]" />
              <span className="text-[0.9rem] font-medium text-[#5d5550]">or</span>
              <div className="h-px flex-1 bg-[#d8d1cb]" />
            </div>

            <div className="mt-7 flex items-center justify-center gap-6">
              <SocialButton
                onClick={handleAppleSignIn}
                disabled={isAppleLoading}
                ariaLabel="Continue with Apple"
                className="bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                {isAppleLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <AppleIcon />}
              </SocialButton>
              <SocialButton
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                ariaLabel="Continue with Google"
                className="border border-[#ddd6cf] bg-white text-black shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                {isGoogleLoading ? <Loader2 className="h-6 w-6 animate-spin text-[#5f6368]" /> : <GoogleIcon />}
              </SocialButton>
              <SocialButton
                onClick={handleEmailSignIn}
                ariaLabel="Continue with Email"
                className="text-white shadow-[0_8px_24px_rgba(146,39,39,0.18)]"
                style={{ backgroundColor: BRAND_MAROON }}
              >
                <Mail className="h-6 w-6" />
              </SocialButton>
            </div>
          </div>

          <div className="pt-6 text-center text-[0.78rem] leading-6 text-[#5e5853]">
            <p>By continuing, you agree to our</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2">
              <Link to="/profile/terms" className="underline underline-offset-2 transition-colors hover:text-black">
                Terms of Service
              </Link>
              <span>&bull;</span>
              <Link to="/profile/privacy" className="underline underline-offset-2 transition-colors hover:text-black">
                Privacy Policy
              </Link>
              <span>&bull;</span>
              <Link to="/profile/refund" className="underline underline-offset-2 transition-colors hover:text-black">
                Content Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
