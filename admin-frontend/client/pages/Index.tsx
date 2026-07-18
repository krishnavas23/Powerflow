import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Zap, BarChart3, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to login after 3 seconds
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card relative overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />

      {/* Animated background elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-20 pointer-events-none" />

      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            POWERFLOW
          </h1>
          <p className="text-2xl text-red-400 font-semibold mb-6">
            Admin Control Panel
          </p>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            Enterprise-grade energy marketplace management. Monitor, control,
            and optimize your entire platform with real-time insights and
            comprehensive analytics.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
              <Zap className="w-8 h-8 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">
                Real-time Energy
              </h3>
              <p className="text-sm text-muted-foreground">
                Monitor live energy flow and distribution
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
              <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive reports and insights
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
              <Lock className="w-8 h-8 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Security</h3>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade protection
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-6 px-8 rounded-lg text-lg inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            Enter Admin Dashboard
            <ArrowRight className="w-5 h-5" />
          </Button>

          {/* Footer text */}
          <p className="mt-8 text-sm text-muted-foreground">
            Redirecting to login in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
