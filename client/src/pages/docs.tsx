import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, BookOpen, Code, Database, Settings, 
  TrendingUp, Users, Zap, Shield, BarChart3,
  ExternalLink, Copy, CheckCircle, ChevronRight
} from "lucide-react";

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string>("");

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Zap,
      items: [
        { title: "Quick Start Guide", href: "#quick-start" },
        { title: "Account Setup", href: "#account-setup" },
        { title: "First Trade Entry", href: "#first-trade" },
      ]
    },
    {
      id: "trading",
      title: "Trading Features",
      icon: TrendingUp,
      items: [
        { title: "Trade Journal", href: "#trade-journal" },
        { title: "P&L Calculations", href: "#pnl-calculations" },
        { title: "Risk Management", href: "#risk-management" },
        { title: "Performance Analytics", href: "#performance" },
      ]
    },
    {
      id: "psychology",
      title: "Trading Psychology",
      icon: BarChart3,
      items: [
        { title: "Emotion Tracking", href: "#emotions" },
        { title: "Behavioral Patterns", href: "#patterns" },
        { title: "Mindset Analysis", href: "#mindset" },
      ]
    },
    {
      id: "api",
      title: "API Reference",
      icon: Code,
      items: [
        { title: "Authentication", href: "#auth-api" },
        { title: "Trades Endpoint", href: "#trades-api" },
        { title: "Analytics Endpoint", href: "#analytics-api" },
      ]
    },
    {
      id: "integrations",
      title: "Integrations",
      icon: Database,
      items: [
        { title: "Broker Connections", href: "#brokers" },
        { title: "Third-party Tools", href: "#third-party" },
        { title: "Data Export", href: "#export" },
      ]
    }
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <span className="text-xl font-semibold">Documentation</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              v2.0
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Navigation</h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-1">
                      <div className="flex items-center space-x-2 py-2 text-sm font-medium text-white">
                        <section.icon className="h-4 w-4 text-blue-400" />
                        <span>{section.title}</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {section.items.map((item) => (
                          <a
                            key={item.href}
                            href={item.href}
                            className="block py-1 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            {item.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Gmetrics Documentation
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Complete guide to mastering trading analytics and psychology tracking
              </p>
            </div>

            {/* Quick Start */}
            <section id="quick-start" className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Zap className="h-7 w-7 text-blue-400 mr-3" />
                Quick Start Guide
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="h-5 w-5 text-green-400 mr-2" />
                      1. Create Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300">
                    Sign up for a free account and choose your trading plan. All plans include core journaling features.
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Settings className="h-5 w-5 text-yellow-400 mr-2" />
                      2. Setup Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300">
                    Configure your trading accounts, preferred instruments, and risk parameters.
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="h-5 w-5 text-blue-400 mr-2" />
                      3. Log First Trade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300">
                    Enter your trade details including entry/exit, position size, and emotional state.
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BarChart3 className="h-5 w-5 text-purple-400 mr-2" />
                      4. Analyze Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300">
                    Review your analytics dashboard to identify patterns and improve your trading.
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Trade Journal Features */}
            <section id="trade-journal" className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <TrendingUp className="h-7 w-7 text-green-400 mr-3" />
                Trade Journal
              </h2>
              
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-white">Comprehensive Trade Tracking</h3>
                  <p className="text-gray-300">
                    Log every aspect of your trades with our advanced journaling system:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2" /> Entry and exit prices with precise timing</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2" /> Position sizing and risk calculations</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2" /> Automatic P&L computation</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2" /> Trade screenshots and notes</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2" /> Emotional state tracking</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* API Reference */}
            <section id="auth-api" className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Code className="h-7 w-7 text-cyan-400 mr-3" />
                API Reference
              </h2>
              
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300">
                    All API requests require authentication using JWT tokens.
                  </p>
                  <div className="bg-gray-800 rounded-lg p-4 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">POST /api/auth/login</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(`curl -X POST https://api.gmetrics.com/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password"}'`, "auth-example")}
                        className="h-6 w-6 p-0"
                      >
                        {copiedCode === "auth-example" ? (
                          <CheckCircle className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <pre className="text-sm text-gray-300 overflow-x-auto">
{`curl -X POST https://api.gmetrics.com/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password"}'`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Support Section */}
            <section className="bg-gray-900/30 rounded-lg p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-4">Need Help?</h3>
              <p className="text-gray-300 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => window.location.href = '/help'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Visit Help Center
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/contact'}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Contact Support
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}