import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, TrendingUp, Brain, Shield, Zap, Target, 
  CheckCircle, ArrowRight, Star, Users, Clock, Award,
  LineChart, DollarSign, Activity, Globe, PieChart,
  Lock, Smartphone, BarChart2, TrendingDown, Eye,
  Database, Settings, Layers3, Rocket, Play,
  ChevronRight, ExternalLink, Github, Twitter,
  MessageCircle, Plus, Menu, X, ChevronDown
} from "lucide-react";
import { HiOutlineChartBarSquare, HiOutlineCurrencyDollar, HiOutlineLightBulb, HiOutlineArrowTrendingUp } from "react-icons/hi2";
import { TbChartBar, TbActivity, TbTrendingUp } from "react-icons/tb";
import { FaWhatsapp } from "react-icons/fa";

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const { user } = useAuth();
  
  const sections = [
    { id: 'hero', name: 'Home' },
    { id: 'features', name: 'Features' },
    { id: 'process', name: 'Process' },
    { id: 'pricing', name: 'Pricing' }
  ];
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Determine current section for scroll indicator
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      const sectionElements = sections.map(section => 
        document.getElementById(section.id) || document.querySelector(`section[id="${section.id}"]`)
      ).filter(Boolean);
      
      let currentIndex = 0;
      sectionElements.forEach((section, index) => {
        if (section && (section as HTMLElement).offsetTop <= scrollPosition) {
          currentIndex = index;
        }
      });
      
      setCurrentSection(currentIndex);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToNextSection = () => {
    const nextSection = sections[currentSection + 1];
    if (nextSection) {
      const element = document.getElementById(nextSection.id) || document.querySelector(`section[id="${nextSection.id}"]`);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100');
          entry.target.classList.add('translate-y-0');
          entry.target.classList.remove('opacity-0');
          entry.target.classList.remove('translate-y-8');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in-section').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Minimal Professional Timeline */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="relative">
          {/* Minimal timeline line */}
          <div className="absolute right-[6px] top-0 bottom-0 w-px bg-gray-700/50"></div>
          
          <div className="flex flex-col space-y-4">
            {sections.map((section, index) => {
              const isActive = index === currentSection;
              
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    const element = document.getElementById(section.id);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="group relative flex items-center justify-end transition-all duration-300"
                  data-testid={`timeline-${section.id}`}
                >
                  {/* Section name label - appears to the left of the dot */}
                  <div className={cn(
                    "mr-4 px-3 py-1 text-xs font-medium rounded-full transition-all duration-300 whitespace-nowrap",
                    isActive 
                      ? "bg-blue-500/20 text-blue-300 opacity-100 translate-x-0" 
                      : "bg-gray-700/50 text-gray-400 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                  )}>
                    {section.name}
                  </div>
                  
                  <div className="relative">
                    <div className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300 flex-shrink-0 relative z-10",
                      isActive 
                        ? "bg-blue-400 scale-125" 
                        : "bg-gray-600 group-hover:bg-gray-400 group-hover:scale-110"
                    )}></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Desktop Navigation */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 glass-nav rounded-full px-8 py-3 shadow-2xl shadow-blue-500/20 hidden md:block">
        <div className="flex items-center justify-between min-w-[600px]">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">
              G<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text ml-1">metrics</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#process" className="text-sm text-gray-300 hover:text-white transition-colors">Process</a>
            <Button 
              onClick={() => window.location.href = user ? '/dashboard' : '/auth'}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-lg"
              data-testid="button-start-journal"
            >
              {user ? 'Dashboard' : 'Get Started'}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Separate glass-nav for mobile */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 glass-nav rounded-full px-6 py-3 shadow-2xl shadow-blue-500/20 md:hidden">
        <div className="flex items-center justify-between min-w-[280px]">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">
              G<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text ml-1">metrics</span>
            </span>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              data-testid="button-mobile-menu-landing"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Enhanced Mobile Menu with slide down animation */}
        <div className={`absolute top-full left-0 right-0 mt-2 transition-all duration-300 ease-in-out transform ${
          isMobileMenuOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}>
          <div className="bg-black/95 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/10">
            <div className="px-6 py-6 space-y-4">
              <div className="space-y-3">
                <a 
                  href="#features" 
                  className="block text-gray-300 hover:text-white transition-all duration-200 py-2 px-3 hover:bg-white/5 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  className="block text-gray-300 hover:text-white transition-all duration-200 py-2 px-3 hover:bg-white/5 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#process" 
                  className="block text-gray-300 hover:text-white transition-all duration-200 py-2 px-3 hover:bg-white/5 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Process
                </a>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <Button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.location.href = user ? '/dashboard' : '/auth';
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full font-semibold transition-all duration-300 shadow-lg"
                  data-testid="button-start-journal-mobile"
                >
                  {user ? 'Dashboard' : 'Get Started'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean and minimal like alphatraderfirm.com */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center px-4">
        {/* Elegant background with subtle gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-blue-600/20 via-blue-800/10 to-transparent rounded-full filter blur-[100px]" />
          <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black via-black/90 to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <div className="mb-8 opacity-0 translate-y-8 fade-in-section transition-all duration-1000">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full px-6 py-2 mb-8">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-300 text-xs font-medium tracking-wide">G-metrics</span>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-8 leading-tight opacity-0 translate-y-8 fade-in-section transition-all duration-1000 delay-200">
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Advanced Journaling
            </span>
          </h1>
          
          <p className="text-xs sm:text-base md:text-lg text-gray-400 mb-16 max-w-3xl mx-auto opacity-0 translate-y-8 fade-in-section transition-all duration-1000 delay-400">
            Engineered to fulfill traders who get the complexities of the markets.<br></br> We combine expertise with cutting-edge technology<br></br>to deliver high-end journaling tools.
          </p>

          <div className="flex flex-row gap-4 justify-center items-center opacity-0 translate-y-8 fade-in-section transition-all duration-1000 delay-500">
            <Button 
              size="default" 
              onClick={() => window.location.href = user ? '/dashboard' : '/auth'}
              className="text-sm sm:text-base px-4 sm:px-8 py-3 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/40 flex-shrink-0"
              data-testid="button-start-journal-hero"
            >
              {user ? 'Dashboard' : 'Get Started'}
            </Button>
            <Button 
              variant="outline" 
              size="default"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm sm:text-base px-4 sm:px-8 py-3 h-12 border-2 border-gray-600 text-white hover:bg-white/5 hover:border-gray-500 rounded-full font-medium transition-all duration-300 flex-shrink-0"
              data-testid="button-explore-more"
            >
              <span className="hidden sm:inline">Learn More</span>
              <span className="sm:hidden">Learn</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section - Clean and minimal */}
      <section id="features" className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="opacity-0 translate-y-8 fade-in-section transition-all duration-1000 mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-8 text-white">
              Professional <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Analytics</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Everything you need to analyze and improve your trading performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              {
                icon: <HiOutlineChartBarSquare className="h-8 w-8 md:h-10 md:w-10 text-white" />,
                title: "Advanced Analytics",
                description: "Deep insights into your trading patterns and performance metrics"
              },
              {
                icon: <HiOutlineCurrencyDollar className="h-8 w-8 md:h-10 md:w-10 text-white" />,
                title: "P&L Tracking",
                description: "Real-time profit and loss tracking with detailed breakdowns"
              },
              {
                icon: <HiOutlineLightBulb className="h-8 w-8 md:h-10 md:w-10 text-white" />,
                title: "Psychology Insights", 
                description: "Track emotional states and build mental discipline"
              },
              {
                icon: <HiOutlineArrowTrendingUp className="h-8 w-8 md:h-10 md:w-10 text-white" />,
                title: "Performance Growth",
                description: "Identify improvement opportunities and track progress"
              }
            ].map((feature, index) => (
              <Card 
                key={feature.title}
                className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-gray-700/50 hover:border-blue-500/30 backdrop-blur-sm transition-all duration-500 group opacity-0 translate-y-8 fade-in-section hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 hover:rotate-x-2 hover:rotate-y-1 transform-gpu perspective-1000 hover:scale-105"
                style={{ transitionDelay: `${index * 100 + 800}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                <CardContent className="relative p-6 md:p-10 text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-8 group-hover:scale-110 group-hover:border-blue-400/40 group-hover:bg-gradient-to-br group-hover:from-blue-500/20 group-hover:to-blue-600/10 transition-all duration-500 shadow-lg">
                    <div className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-3 md:mb-6 group-hover:text-blue-100 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Simplified */}
      <section id="process" className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="text-center mb-20 opacity-0 translate-y-8 fade-in-section transition-all duration-1000">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">
              How It Works
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Simple process to start improving your trading performance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Track Trades",
                description: "Log your trades with detailed information including strategy, emotions, and market conditions",
                icon: <TbChartBar className="h-8 w-8 text-white" />
              },
              {
                step: "02", 
                title: "Analyze Data",
                description: "Use advanced analytics to identify patterns, strengths, and areas for improvement",
                icon: <TbActivity className="h-8 w-8 text-white" />
              },
              {
                step: "03",
                title: "Improve Results",
                description: "Apply insights to build consistency and achieve better trading performance",
                icon: <TbTrendingUp className="h-8 w-8 text-white" />
              }
            ].map((item, index) => (
              <div 
                key={item.step}
                className="text-center opacity-0 translate-y-8 fade-in-section transition-all duration-1000"
                style={{ transitionDelay: `${index * 200 + 1200}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 mx-auto mb-6 flex items-center justify-center hover:scale-105 hover:from-gray-700 hover:to-gray-600 transition-all duration-300">
                  {item.icon}
                </div>
                <div className="text-sm font-mono text-blue-400 mb-3">STEP {item.step}</div>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed max-w-sm mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16 opacity-0 translate-y-8 fade-in-section transition-all duration-1000 delay-1000">
            <Button 
              size="lg"
              onClick={() => window.location.href = user ? '/dashboard' : '/auth'}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-12 py-6 text-lg rounded-full font-semibold transition-all duration-300 shadow-xl"
              data-testid="button-start-journaling"
            >
              {user ? 'Go to Dashboard' : 'Start Your Analytics Journey'}
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section - Simple and clean */}
      <section id="pricing" className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="opacity-0 translate-y-8 fade-in-section transition-all duration-1000 mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">
              Simple Pricing
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Choose the plan that works best for your trading needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "$0",
                period: "/forever",
                description: "Perfect for getting started",
                features: ["60 Trade Logs", "Basic Analytics", "Mobile Access", "Essential Features"],
                isDefault: true
              },
              {
                name: "Plus",
                price: "$29", 
                period: "/month",
                description: "For active traders",
                features: ["300 Trade Logs", "Advanced Analytics", "Private Coaching", "Priority Support"],
                popular: true,
                checkoutHash: "plus"
              },
              {
                name: "Pro",
                price: "$60",
                period: "/month", 
                description: "Professional traders",
                features: ["All features from Plus", "Unlimited Trade Logs", "Brokerage Linking", "API Facilities"],
                checkoutHash: "pro"
              }
            ].map((plan, index) => (
              <Card 
                key={plan.name} 
                className={cn(
                  "relative bg-gradient-to-br from-gray-900/60 to-gray-800/40 border transition-all duration-300 hover:scale-105 opacity-0 translate-y-8 fade-in-section",
                  plan.popular 
                    ? "border-blue-500/50 shadow-xl shadow-blue-500/10" 
                    : "border-gray-800 hover:border-gray-700"
                )}
                style={{ transitionDelay: `${index * 200 + 1000}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1">
                      Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-blue-400">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-gray-400 mb-8">{plan.description}</p>
                  <ul className="space-y-3 mb-8 text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-blue-400 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={cn(
                      "w-full rounded-full font-semibold transition-all duration-300",
                      plan.popular 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white" 
                        : "bg-gray-800 hover:bg-gray-700 text-white"
                    )}
                    onClick={() => {
                      if (plan.isDefault) {
                        window.location.href = user ? '/dashboard' : '/auth';
                        return;
                      }
                      if (plan.checkoutHash) {
                        window.location.href = `/checkout#${plan.checkoutHash}`;
                      }
                    }}
                  >
                    Get Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scroll Indicator - Only visible in first section */}
      {currentSection === 0 && (
        <button
          onClick={scrollToNextSection}
          className="fixed bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 z-50 group animate-bounce"
          data-testid="scroll-indicator"
        >
          <ChevronDown className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-all duration-300 group-hover:scale-110" />
        </button>
      )}

      {/* Footer - Minimal and clean */}
      <footer className="relative py-20 px-4 border-t border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl font-bold text-white">
                  G<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text ml-1">metrics</span>
                </span>
              </div>
              <p className="text-gray-400 max-w-md">
                Professional trading analytics platform designed for serious traders who want to build consistent profits.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#process" className="hover:text-white transition-colors">How it works</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2025 Gmetrics. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a 
                href="https://wa.me/18094866678" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
                title="Contáctanos por WhatsApp"
              >
                <FaWhatsapp className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}