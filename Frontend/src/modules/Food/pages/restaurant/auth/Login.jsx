import { useEffect, useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Heart, ArrowRight, Loader2, Mail, Apple } from "lucide-react"
import { toast } from "sonner"
import { restaurantAPI } from "@food/api"
import logoNew from "@/assets/logo.png"

const DEFAULT_COUNTRY_CODE = "+91"

export default function RestaurantLogin() {
  const navigate = useNavigate()
  const phoneInputRef = useRef(null)
  const [phone, setPhone] = useState(() => sessionStorage.getItem("restaurantLoginPhone") || "")
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  const validatePhone = (num) => {
    const digits = num.replace(/\D/g, "")
    if (digits.length !== 10) return false
    return ["6", "7", "8", "9"].includes(digits[0])
  }

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()
    if (!validatePhone(phone)) {
      toast.error("Please enter a valid 10-digit mobile number")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)

    const fullPhone = `${DEFAULT_COUNTRY_CODE} ${phone}`.trim()

    try {
      await restaurantAPI.sendOTP(fullPhone, "login")
      const authData = {
        method: "phone",
        phone: fullPhone,
        isSignUp: false,
        module: "restaurant",
      }
      sessionStorage.setItem("restaurantAuthData", JSON.stringify(authData))
      sessionStorage.setItem("restaurantLoginPhone", phone)
      toast.success("Verification code sent!")
      navigate("/food/restaurant/otp")
    } catch (apiErr) {
      const msg = apiErr?.response?.data?.message || apiErr?.message || "Failed to send OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleAppleLogin = () => {
    toast.message("Apple login for restaurant accounts will be enabled here once the backend flow is ready.")
  }

  const handleEmailLogin = () => {
    toast.message("Email login for restaurant accounts is not active yet. Please use mobile OTP for now.")
  }

  const primaryColor = "#2A9C64"

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-['Poppins']">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[440px]"
        >
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative inline-block mb-4"
            >
              <img 
                src={logoNew} 
              alt="Tifunbox Logo"
                className="w-32 h-32 md:w-36 md:h-36 object-contain mx-auto"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-[0.3em]"
            >
              RESTAURANT PARTNER
            </motion.p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg border border-gray-100">

            <div className="mb-10 text-center sm:text-left">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 font-['Outfit'] tracking-tight">
                Partner Login
              </h2>
              <div className="h-1 w-10 bg-[#2A9C64] rounded-full mb-3 hidden sm:block" />
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                Enter your registered mobile number to manage your restaurant
              </p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-8">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">Mobile Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <span className="text-sm font-bold text-[#2A9C64] border-r border-gray-200 dark:border-gray-800 pr-3">+91</span>
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    className="block w-full pl-16 pr-6 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white border-2 border-transparent focus:border-[#2A9C64]/50 rounded-2xl outline-none transition-all placeholder:text-gray-300 font-bold text-lg shadow-sm"
                    placeholder="00000 00000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A9C64] py-4.5 text-lg font-bold text-white transition-all active:scale-[0.98] hover:bg-[#6a2f56] disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span>Get Start</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm font-medium text-gray-400">or</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAppleLogin}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-300 hover:bg-gray-50"
                  >
                    <Apple className="h-4 w-4" />
                    <span>Apple</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEmailLogin}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-300 hover:bg-gray-50"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed max-w-[320px] mx-auto">
              By continuing, you agree to Tifunbox's <br />
              <Link to="/food/restaurant/terms" className="text-gray-900 dark:text-white font-bold hover:text-[#2A9C64] transition-colors">Terms of Service</Link> & <Link to="/food/restaurant/privacy" className="text-gray-900 dark:text-white font-bold hover:text-[#2A9C64] transition-colors">Privacy Policy</Link>
            </p>
          </div>

          <div className="mt-12 flex justify-center items-center gap-6 opacity-30 grayscale hover:opacity-60 transition-opacity">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Business Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Partner Success</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

