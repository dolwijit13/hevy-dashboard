import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Lock, Dumbbell, ShieldAlert, LogOut, Loader2, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { user, isAuthorized, authError, signInWithGoogle, signOut } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setLocalError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google');
      setIsSubmitting(false);
    }
  };

  const isAccessDenied = user && !isAuthorized;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full">
        {/* Card */}
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center">
          {/* Top Logo / Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            {isAccessDenied ? (
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            ) : (
              <Dumbbell className="w-8 h-8 text-emerald-400" />
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Hevy Analytics Pro
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 mb-8 leading-relaxed">
            {isAccessDenied
              ? 'พื้นที่ข้อมูลส่วนตัว — บัญชีของคุณไม่ได้รับสิทธิ์เข้าถึง'
              : 'พื้นที่ข้อมูลส่วนตัว กรุณาเข้าสู่ระบบเพื่อเข้าถึงแดชบอร์ดและประวัติการออกกำลังกาย'}
          </p>

          {/* Configuration Warning if Supabase is missing */}
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-200">ยังไม่ได้ตั้งค่า Supabase</strong>
                กรุณาตรวจสอบว่ามีค่า <code className="bg-zinc-900 px-1 py-0.5 rounded text-[11px]">SUPABASE_PROJECT_URL</code> และ <code className="bg-zinc-900 px-1 py-0.5 rounded text-[11px]">SUPABASE_PUBLISHABLE_KEY</code> ใน <code className="bg-zinc-900 px-1 py-0.5 rounded text-[11px]">.env.local</code> หรือยัง
              </div>
            </div>
          )}

          {/* Access Denied State (User logged in with unauthorized email) */}
          {isAccessDenied ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-left text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Access Denied (ไม่อนุญาตให้เข้าถึง)</span>
                </div>
                <p className="text-zinc-300 text-xs">
                  คุณได้เข้าสู่ระบบด้วยบัญชี:
                </p>
                <div className="bg-zinc-900 px-3 py-2 rounded-xl text-rose-300 font-mono font-medium text-xs break-all border border-rose-500/20">
                  {user?.email}
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed pt-1">
                  อีเมลนี้ไม่ได้อยู่ในรายชื่อผู้มีสิทธิ์เข้าถึงแดชบอร์ดส่วนตัวนี้ หากนี่คือบัญชีของคุณ ให้ระบุอีเมลนี้ในตัวแปร <code className="text-zinc-200 font-mono">VITE_ALLOWED_EMAILS</code>
                </p>
              </div>

              <button
                onClick={() => signOut()}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/10 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 text-zinc-400" />
                <span>ออกจากระบบ / สลับบัญชี Google</span>
              </button>
            </div>
          ) : (
            /* Normal Login State */
            <div className="space-y-4">
              {(authError || localError) && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{authError || localError}</span>
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting || !isSupabaseConfigured}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-white/5 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
                    <span>กำลังนำทางไปที่ Google...</span>
                  </>
                ) : (
                  <>
                    {/* Google G Logo SVG */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>ดำเนินการต่อด้วย Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs pt-3">
                <Lock className="w-3.5 h-3.5" />
                <span>สิทธิ์เฉพาะบัญชีที่ได้รับอนุญาตเท่านั้น</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-400 mt-6 font-mono">
          Powered by Supabase Auth & Google OAuth
        </p>
      </div>
    </div>
  );
};

