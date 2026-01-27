import { useState, ReactNode, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
// Icons (trimmed to only those used here)
import {
  BarChart3,
  Lock,
  Calculator,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { SiX, SiMedium, SiYoutube, SiDiscord, SiGithub, SiTelegram } from "react-icons/si";
interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  pageLogo?: string;
  pageWebsite?: string;
  tokenLogo?: string;
  tokenWebsite?: string;
  contractAddress?: string;
  tokenTicker?: string;
  tokenName?: string;
}
// Route-based page info
const pageInfo = {
  "/": {
    title: "OEC Staking",
    description: "Earn rewards by staking your OEC tokens",
  },
  "/dashboard": {
    title: "OEC Staking",
    description: "Earn rewards by staking your OEC tokens",
  },
  "/pools": {
    title: "Staking Pools",
    description: "Choose from various staking pools",
  },
  "/calculator": {
    title: "ROI Calculator",
    description: "Calculate your potential staking rewards and strategize",
  },
} as const;
export function Layout({
  children,
  pageTitle,
  pageDescription,
  pageLogo,
  pageWebsite,
  tokenLogo,
  tokenWebsite,
  tokenTicker,
  tokenName,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [donationStep, setDonationStep] = useState<"addresses" | "thankyou">("addresses");
  const [selectedDonationType, setSelectedDonationType] = useState<string>("");
  const [donorName, setDonorName] = useState("");
  const [location, navigate] = useLocation();
  const isNavigatingRef = useRef(false);
  const lockedCollapsedStateRef = useRef<boolean | null>(null);
  // Social links
  const socialLinks = [
    { name: "Twitter/X", icon: SiX, url: "https://x.com/Oeconomia2025", enabled: true },
    { name: "Medium", icon: SiMedium, url: "https://medium.com/@oeconomia2025", enabled: true },
    { name: "YouTube", icon: SiYoutube, url: "https://www.youtube.com/@Oeconomia2025", enabled: true },
    { name: "Discord", icon: SiDiscord, url: "https://discord.com/invite/XSgZgeVD", enabled: true },
    { name: "GitHub", icon: SiGithub, url: "https://github.com/Oeconomia2025", enabled: true },
    { name: "Telegram", icon: SiTelegram, url: "https://t.me/OeconomiaDAO", enabled: true },
  ];
  // Merge explicit props with route defaults
  const routePageInfo = pageInfo[location as keyof typeof pageInfo] || pageInfo["/"];
  const currentPageInfo = {
    title: pageTitle || routePageInfo.title,
    description: pageDescription || routePageInfo.description,
  };
  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);
  // Enforce locked collapse state during navigation
  useEffect(() => {
    if (lockedCollapsedStateRef.current !== null && sidebarCollapsed !== lockedCollapsedStateRef.current) {
      setSidebarCollapsed(lockedCollapsedStateRef.current);
      localStorage.setItem("sidebar-collapsed", String(lockedCollapsedStateRef.current));
      setTimeout(() => {
        if (lockedCollapsedStateRef.current !== null) {
          setSidebarCollapsed(lockedCollapsedStateRef.current);
        }
      }, 0);
    }
  }, [sidebarCollapsed]);
  // Unlock after navigation completes
  useEffect(() => {
    if (isNavigatingRef.current) {
      setTimeout(() => {
        isNavigatingRef.current = false;
        lockedCollapsedStateRef.current = null;
      }, 100);
    }
  }, [location]);
  const handleNavigation = (path: string) => {
    const wasCollapsed = sidebarCollapsed;
    // Mobile: simple
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      navigate(path);
      setSidebarOpen(false);
      return;
    }
    // Desktop: lock sidebar state during navigation
    lockedCollapsedStateRef.current = wasCollapsed;
    isNavigatingRef.current = true;
    localStorage.setItem("sidebar-collapsed", String(wasCollapsed));
    navigate(path);
    setTimeout(() => {
      setSidebarCollapsed(wasCollapsed);
      localStorage.setItem("sidebar-collapsed", String(wasCollapsed));
    }, 1);
  };
  const toggleCollapsed = () => {
    isNavigatingRef.current = false;
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };
  const sidebarItems = [
    { icon: BarChart3, label: "Dashboard", path: "/", active: location === "/" || location === "/dashboard" },
    { icon: Lock, label: "Staking Pools", path: "/pools", active: location === "/pools" },
    { icon: Calculator, label: "ROI Calc", path: "/calculator", active: location === "/calculator" },
  ];
  return (
    <>
      {/* Root: sidebar + main column in the SAME flex row */}
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <aside
          className={fixed inset-y-0 left-0 z-50 ${
            sidebarCollapsed ? "w-16" : "w-48"
          } bg-gray-950 border-r border-gray-700 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col shadow-xl shadow-black/70}
        >
          {/* Sidebar header */}
          <div className="sticky top-0 z-10 bg-gray-950 flex items-center justify-between h-20 px-4 border-b-0">
            <div className=flex items-center ${sidebarCollapsed ? "justify-center w-full" : "space-x-3"}}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img src="/oec-logo.png" alt="Oeconomia Logo" className="w-full h-full object-cover" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h2 className="text-lg font-bold">Oeconomia</h2>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={toggleCollapsed} className="hidden lg:flex">
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Sidebar nav */}
          <div className="sticky top-20 bg-gray-950 z-10 border-b-0">
            <nav className="p-2">
              <ul className="space-y-2">
                {sidebarItems.map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={w-full flex items-center ${
                        sidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"
                      } py-2 rounded-lg text-left transition-colors group relative ${
                        item.active
                          ? "text-white font-medium shadow-lg transition-all duration-200"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }}
                      style={item.active ? { background: "linear-gradient(45deg, 
#00d4ff, 
#ff00ff)" } : {}}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--crypto-dark)] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          {/* Fill space */}
          <div className="flex-1 overflow-y-auto p-4" />
          {/* Bottom alert */}
          <div className="sticky bottom-0 bg-gray-950 p-4 border-t-0 flex flex-col items-center space-y-3">
            {/* Oeconomia Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://oeconomia.io/', '_blank')}
              className={w-full flex items-left ${
                sidebarCollapsed ? "justify-left px-1" : "space-x-3 px-3"
              } py-2 rounded-lg text-left transition-colors group relative bg-transparent text-white hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 border-2 border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-border}
              style={{
                borderRadius: '5px',
                background: 'linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(45deg, 
#a855f7, 
#3b82f6, 
#06b6d4) border-box'
              }}
              title={sidebarCollapsed ? "Oeconomia" : undefined}
            >
              <img
                src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/OEC%20Logo%20Square.png"
                alt="OEC Logo"
                className="w-5 h-5 flex-shrink-0"
              />
              {!sidebarCollapsed && <span className="ml-2">Oeconomia</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--crypto-dark)] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Oeconomia
                </div>
              )}
            </Button>
            <WalletConnect />
          </div>
        </aside>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        {/* === MAIN COLUMN: header + page content (stacked) === */}
        <div className="flex-1 lg:ml-0 relative flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-gray-950 border-b-0 px-6 h-20 flex items-center shadow-xl shadow-black/70">
            <div className="flex items-center justify-between w-full">
              {/* Left side: burger + title */}
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
                <div className="flex items-center space-x-3">
                  {(tokenLogo || pageLogo) && (
                    <img
                      src={tokenLogo || pageLogo}
                      alt="Token logo"
                      className="w-12 h-12 rounded-full"
                      style={{ border: "0.5px solid rgba(255, 255, 255, 0.3)" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/oec-logo.png";
                      }}
                    />
                  )}
                  <div className="flex flex-col">
                    {tokenTicker && tokenName ? (
                      <div>
                        <div className="flex items-center space-x-2">
                          <h1 className="text-xl font-semibold text-white">{tokenTicker}</h1>
                          {(tokenWebsite || pageWebsite) && (

                              href={tokenWebsite || pageWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-crypto-blue hover:text-crypto-blue/80 transition-colors"
                              title="Visit official website"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tokenName}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2">
                          <h1 className="text-xl font-semibold text-white">{currentPageInfo.title}</h1>
                          {(tokenWebsite || pageWebsite) && (

                              href={tokenWebsite || pageWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-crypto-blue hover:text-crypto-blue/80 transition-colors"
                              title="Visit official website"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground hidden md:block">
                          {currentPageInfo.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Right side: pills + socials */}
              <div className="flex items-center space-x-4">
                {/* Stats pills */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="bg-gray-800 rounded-full px-5 py-1 text-xs font-medium text-cyan-400 border border-cyan-400/30">
                    Price: $0.73
                  </div>
                  <div className="bg-gray-800 rounded-full px-3 py-1 text-xs font-medium text-cyan-400 border border-cyan-400/30">
                    Total Supply: 100M
                  </div>
                  <div className="bg-gray-800 rounded-full px-5 py-1 text-xs font-medium text-cyan-400 border border-cyan-400/30">
                    Circ: 60M
                  </div>
                  <div className="bg-gray-800 rounded-full px-5 py-1 text-xs font-medium text-cyan-400 border border-cyan-400/30">
                    TVL: $0
                  </div>
                </div>
                {/* Social menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 p-0 rounded-full bg-gray-800 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-purple-600 transition-all duration-200"
                      title="Social Media Links"
                    >
                      <Globe className="w-5 h-5 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-36">
                    <DropdownMenuItem
                      onClick={() => window.open("https://oeconomia.tech/", "_blank")}
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-600/20 transition-all duration-200"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </DropdownMenuItem>
                    {socialLinks.map((link) => (
                      <DropdownMenuItem
                        key={link.name}
                        onClick={() => link.enabled && window.open(link.url, "_blank")}
                        className={cursor-pointer hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-600/20 transition-all duration-200 ${
                          !link.enabled ? "opacity-50" : ""
                        }}
                        disabled={!link.enabled}
                      >
                        <link.icon className="w-4 h-4 mr-2" />
                        {link.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          {/* Page content + footer */}
          <main className="flex-1">
            {children}
            <footer className="border-t-0 mt-8 py-6 px-6 text-center">
              <p className="text-sm text-muted-foreground">© 2025 Oeconomia. All rights reserved.</p>
            </footer>
          </main>
        </div>
        {/* === END MAIN COLUMN === */}
      </div>
      {/* Disclaimer Modal - REMOVED */}
      {/* Support Modal */}
      {supportOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSupportOpen(false)}
        >
          <Card
            className="max-w-4xl w-full bg-[var(--crypto-card)] border-crypto-border p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setSupportOpen(false);
                setTimeout(() => {
                  setDonationStep("addresses");
                  setSelectedDonationType("");
                  setDonorName("");
                }, 300);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {donationStep === "addresses" ? (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-400 fill-current animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Support Development</h2>
                    <p className="text-sm text-gray-400">Help Oeconomia Grow</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <p className="text-gray-300">
                    Your support helps fund essential infrastructure including servers, databases, APIs, and
                    blockchain node operations. These resources are critical for maintaining the platform's
                    performance and reliability.
                  </p>
                  <p className="text-gray-300">
                    Additionally, upcoming marketing initiatives will help expand the Oeconomia ecosystem and
                    reach new users. Every contribution directly supports continued development and innovation.
                  </p>
                  <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border border-cyan-500/30 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-cyan-400 mb-2">Donation Addresses (Click to Copy):</h3>
                    <div className="space-y-3 text-sm">
                      {/* EVM */}
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 font-medium min-w-[120px]">EVM Networks:</span>
                        <div
                          className={font-mono text-xs p-2 rounded break-all cursor-pointer transition-all duration-300 flex-1 ${
                            copiedAddress === "evm"
                              ? "bg-green-500/30 border border-green-500/50 text-green-300"
                              : "bg-black/30 hover:bg-black/50"
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText("0xD02dbe54454F6FE3c2F9F1F096C5460284E418Ed");
                            setCopiedAddress("evm");
                            setSelectedDonationType("EVM Networks");
                            setTimeout(() => setCopiedAddress(null), 2000);
                            setTimeout(() => setDonationStep("thankyou"), 2500);
                          }}
                          title="Click to copy address"
                        >
                          {copiedAddress === "evm" ? "✓ Copied!" : "0xD02dbe54454F6FE3c2F9F1F096C5460284E418Ed"}
                        </div>
                      </div>
                      {/* SOL */}
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 font-medium min-w-[120px]">Solana:</span>
                        <div
                          className={font-mono text-xs p-2 rounded break-all cursor-pointer transition-all duration-300 flex-1 ${
                            copiedAddress === "sol"
                              ? "bg-green-500/30 border border-green-500/50 text-green-300"
                              : "bg-black/30 hover:bg-black/50"
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText("HkJhW2X9xYw9n4sp3e9BBh33Np6iNghpU7gtDJ5ATqYx");
                            setCopiedAddress("sol");
                            setSelectedDonationType("Solana");
                            setTimeout(() => setCopiedAddress(null), 2000);
                            setTimeout(() => setDonationStep("thankyou"), 2500);
                          }}
                          title="Click to copy address"
                        >
                          {copiedAddress === "sol" ? "✓ Copied!" : "HkJhW2X9xYw9n4sp3e9BBh33Np6iNghpU7gtDJ5ATqYx"}
                        </div>
                      </div>
                      {/* SUI */}
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 font-medium min-w-[120px]">Sui Network:</span>
                        <div
                          className={font-mono text-xs p-2 rounded break-all cursor-pointer transition-all duration-300 flex-1 ${
                            copiedAddress === "sui"
                              ? "bg-green-500/30 border border-green-500/50 text-green-300"
                              : "bg-black/30 hover:bg-black/50"
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(
                              "0xef000226f93506df5a3b1eaaae7835e919ff69c18d4929ed1537d656fb324dfe"
                            );
                            setCopiedAddress("sui");
                            setSelectedDonationType("Sui Network");
                            setTimeout(() => setCopiedAddress(null), 2000);
                            setTimeout(() => setDonationStep("thankyou"), 2500);
                          }}
                          title="Click to copy address"
                        >
                          {copiedAddress === "sui"
                            ? "✓ Copied!"
                            : "0xef000226f93506df5a3b1eaaae7835e919ff69c18d4929ed1537d656fb324dfe"}
                        </div>
                      </div>
                      {/* BTC */}
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 font-medium min-w-[120px]">Bitcoin:</span>
                        <div
                          className={font-mono text-xs p-2 rounded break-all cursor-pointer transition-all duration-300 flex-1 ${
                            copiedAddress === "btc"
                              ? "bg-green-500/30 border border-green-500/50 text-green-300"
                              : "bg-black/30 hover:bg-black/50"
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText("bc1qwtzdtx6ghfzy065wmv3xfk8tyqqr2w87tnrx9r");
                            setCopiedAddress("btc");
                            setSelectedDonationType("Bitcoin");
                            setTimeout(() => setCopiedAddress(null), 2000);
                            setTimeout(() => setDonationStep("thankyou"), 2500);
                          }}
                          title="Click to copy address"
                        >
                          {copiedAddress === "btc" ? "✓ Copied!" : "bc1qwtzdtx6ghfzy065wmv3xfk8tyqqr2w87tnrx9r"}
                        </div>
                      </div>
                      {/* CashApp */}
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 font-medium min-w-[120px]">CashApp:</span>
                        <div
                          className={font-mono text-xs p-2 rounded break-all cursor-pointer transition-all duration-300 flex-1 ${
                            copiedAddress === "cashapp"
                              ? "bg-green-500/30 border border-green-500/50 text-green-300"
                              : "bg-black/30 hover:bg-black/50"
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText("$oooJASONooo");
                            setCopiedAddress("cashapp");
                            setSelectedDonationType("CashApp");
                            setTimeout(() => setCopiedAddress(null), 2000);
                            setTimeout(() => setDonationStep("thankyou"), 2500);
                          }}
                          title="Click to copy CashApp tag"
                        >
                          {copiedAddress === "cashapp" ? "✓ Copied!" : "$oooJASONooo"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-400">
                      <strong>Thank you for your support!</strong> Every contribution is deeply appreciated and
                      will be remembered. When the opportunity arises, I am committed to giving back to the
                      community.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setSupportOpen(false)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
                >
                  Close
                </Button>
              </div>
            ) : (
              // Thank You screen
              <div className="animate-in slide-in-from-right duration-700 ease-out">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center animate-pulse">
                      <Heart className="w-10 h-10 text-pink-400 fill-current animate-bounce" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: "0.5s" }}></div>
                  </div>
                  <div className="space-y-3">
                    <h2
                      className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-500"
                      style={{ animationDelay: "0.2s" }}
                    >
                      Thank You!
                    </h2>
                    <p
                      className="text-lg text-gray-300 animate-in slide-in-from-bottom duration-500"
                      style={{ animationDelay: "0.4s" }}
                    >
                      Your {selectedDonationType} donation address has been copied
                    </p>
                  </div>
                  <div
                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4 space-y-3 animate-in slide-in-from-bottom duration-500"
                    style={{ animationDelay: "0.6s" }}
                  >
                    <p className="text-gray-300">Your support means the world to us! 🌟 Every contribution helps fund:</p>
                    <ul className="text-sm text-gray-400 space-y-1 text-left">
                      <li>• Server infrastructure & database operations</li>
                      <li>• Live market data API subscriptions</li>
                      <li>• New feature development</li>
                      <li>• Community growth initiatives</li>
                    </ul>
                  </div>
                  <div className="space-y-3 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: "0.8s" }}>
                    <p className="text-sm text-gray-400">Want a personal thank you message? (Optional)</p>
                    <input
                      type="text"
                      placeholder="Your name or handle"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {donorName && (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-3 animate-in slide-in-from-bottom duration-500">
                      <p className="text-green-400">
                        <span className="font-semibold">Dear {donorName},</span>
                        <br />
                        Your generosity will be remembered. When Oeconomia thrives, supporters like you will be among
                        the first to benefit from our success. Thank you for believing in our vision!
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: "1s" }}>
                    <Button
                      onClick={() => {
                        setDonationStep("addresses");
                        setSelectedDonationType("");
                      }}
                      variant="outline"
                      className="flex-1 border-gray-600 hover:bg-gray-700"
                    >
                      Back to Addresses
                    </Button>
                    <Button
                      onClick={() => {
                        setSupportOpen(false);
                        setTimeout(() => {
                          setDonationStep("addresses");
                          setSelectedDonationType("");
                          setDonorName("");
                        }, 300);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
