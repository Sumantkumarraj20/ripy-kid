"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { 
  FiBook, 
  FiMapPin, 
  FiShield, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiHome,
  FiUsers,
  FiBarChart2,
  FiCalendar,
  FiHeart,
  FiBookOpen,
  FiAward,
  FiBell,
  FiMessageSquare,
  FiChevronDown,
  FiMoreHorizontal
} from "react-icons/fi";
import { 
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineCog,
  HiOutlineClipboardList
} from "react-icons/hi";

// Define user roles type
type UserRole = 'unverified' | 'kid' | 'parent' | 'guardian' | 'principal' | 'teacher' | 
                'external_educator' | 'caregiver' | 'admin' | 'class_teacher' | 'healthcare_provider';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  category?: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isSupabaseConnected } = useAuth();

  const userProfile = user ? {
    id: user.id,
    email: user.email,
    role: (user.user_metadata?.role || 'unverified') as UserRole,
    name: user.user_metadata?.full_name || 'User'
  } : null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Define navigation items with categories for better organization
  const getNavigationItems = (): NavigationItem[] => {
    const items: NavigationItem[] = [
      // Dashboard
      { 
        href: "/dashboard", 
        label: "Dashboard", 
        icon: <FiHome className="w-4 h-4" />, 
        roles: ['parent', 'guardian', 'principal', 'teacher', 'external_educator', 'caregiver', 'admin', 'class_teacher', 'healthcare_provider'],
        category: "general"
      },
      
      // Learning & Education
      { 
        href: "/learn", 
        label: "Learn", 
        icon: <FiBook className="w-4 h-4" />, 
        roles: ['kid', 'parent', 'guardian', 'teacher', 'external_educator', 'class_teacher'],
        category: "education"
      },
      { 
        href: "/courses", 
        label: "Courses", 
        icon: <HiOutlineAcademicCap className="w-4 h-4" />, 
        roles: ['kid', 'teacher', 'external_educator', 'class_teacher'],
        category: "education"
      },
      { 
        href: "/assignments", 
        label: "Assignments", 
        icon: <HiOutlineClipboardList className="w-4 h-4" />, 
        roles: ['kid', 'teacher', 'class_teacher'],
        category: "education"
      },
      
      // Tracking & Safety
      { 
        href: "/track", 
        label: "Location", 
        icon: <FiMapPin className="w-4 h-4" />, 
        roles: ['parent', 'guardian', 'caregiver', 'admin'],
        category: "safety"
      },
      { 
        href: "/safety", 
        label: "Safety", 
        icon: <FiShield className="w-4 h-4" />, 
        roles: ['parent', 'guardian', 'caregiver', 'admin'],
        category: "safety"
      },
      { 
        href: "/alerts", 
        label: "Alerts", 
        icon: <FiBell className="w-4 h-4" />, 
        roles: ['parent', 'guardian', 'caregiver', 'admin', 'principal'],
        category: "safety"
      },
      
      // Management & Administration
      { 
        href: "/students", 
        label: "Students", 
        icon: <FiUsers className="w-4 h-4" />, 
        roles: ['teacher', 'class_teacher', 'principal', 'admin'],
        category: "management"
      },
      { 
        href: "/classes", 
        label: "Classes", 
        icon: <HiOutlineUserGroup className="w-4 h-4" />, 
        roles: ['teacher', 'class_teacher', 'principal', 'admin'],
        category: "management"
      },
      { 
        href: "/reports", 
        label: "Reports", 
        icon: <FiBarChart2 className="w-4 h-4" />, 
        roles: ['parent', 'guardian', 'teacher', 'principal', 'admin', 'class_teacher'],
        category: "management"
      },
      { 
        href: "/schedule", 
        label: "Schedule", 
        icon: <FiCalendar className="w-4 h-4" />, 
        roles: ['kid', 'parent', 'guardian', 'teacher', 'class_teacher'],
        category: "management"
      },
      
      // Healthcare & Wellness
      { 
        href: "/health", 
        label: "Health", 
        icon: <FiHeart className="w-4 h-4" />, 
        roles: ['parent', 'guardian', 'healthcare_provider', 'admin'],
        category: "health"
      },
      { 
        href: "/medications", 
        label: "Medications", 
        icon: <FiAward className="w-4 h-4" />, 
        roles: ['parent', 'guardian', 'healthcare_provider', 'caregiver'],
        category: "health"
      },
      
      // Communication
      { 
        href: "/messages", 
        label: "Messages", 
        icon: <FiMessageSquare className="w-4 h-4" />, 
        roles: ['parent', 'guardian', 'teacher', 'principal', 'admin', 'class_teacher', 'healthcare_provider'],
        category: "communication"
      },
    ];

    if (!userProfile) return [];

    return items.filter(item => 
      item.roles.includes(userProfile.role) || userProfile.role === 'admin'
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      unverified: { label: "Unverified", color: "badge-warning" },
      kid: { label: "Student", color: "badge-primary" },
      parent: { label: "Parent", color: "badge-success" },
      guardian: { label: "Guardian", color: "badge-success" },
      principal: { label: "Principal", color: "badge-purple" },
      teacher: { label: "Teacher", color: "badge-blue" },
      external_educator: { label: "Educator", color: "badge-blue" },
      caregiver: { label: "Caregiver", color: "badge-orange" },
      admin: { label: "Admin", color: "badge-red" },
      class_teacher: { label: "Class Teacher", color: "badge-indigo" },
      healthcare_provider: { label: "Healthcare", color: "badge-pink" }
    };

    const config = roleConfig[role] || roleConfig.unverified;
    return (
      <span className={`badge ${config.color} text-xs`}>
        {config.label}
      </span>
    );
  };

  // Responsive navigation grouping
  const navigationItems = getNavigationItems();
  
  // For desktop: show first 4 items, rest in dropdown
  const primaryNavItems = navigationItems.slice(0, 4);
  const secondaryNavItems = navigationItems.slice(4);

  // Group secondary items by category for better organization
  const groupedSecondaryItems = secondaryNavItems.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const authItems = userProfile
    ? [
        { href: "/profile", label: "Profile", icon: <FiUser className="w-4 h-4" /> },
        { href: "/settings", label: "Settings", icon: <HiOutlineCog className="w-4 h-4" /> },
      ]
    : [
        { href: "/auth?mode=signin", label: "Sign In", icon: <FiUser className="w-4 h-4" /> },
        { href: "/auth?mode=signup", label: "Sign Up", icon: <FiUser className="w-4 h-4" /> },
      ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-lg"
          : "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            href={userProfile ? "/dashboard" : "/"} 
            className="flex items-center gap-3 group flex-shrink-0"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform duration-200 shadow-lg">
              KT
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Kid Track
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Child Safety & Location
              </p>
            </div>
          </Link>

          {/* Desktop Navigation - Responsive with dropdowns */}
          {userProfile && navigationItems.length > 0 && (
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-4xl mx-8">
              {/* Primary Navigation Items */}
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    pathname === item.href
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              {/* More Items Dropdown */}
              {secondaryNavItems.length > 0 && (
                <div className="relative group">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 flex-shrink-0"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  >
                    <FiMoreHorizontal className="w-4 h-4" />
                    More
                    <FiChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Enhanced Dropdown Menu */}
                  <div className={`absolute top-full left-0 mt-1 min-w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 backdrop-blur-sm ${
                    isMoreMenuOpen ? '!opacity-100 !visible' : ''
                  }`}>
                    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(groupedSecondaryItems).map(([category, items]) => (
                        <div key={category}>
                          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </h3>
                          <div className="space-y-1">
                            {items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
                                onClick={() => setIsMoreMenuOpen(false)}
                              >
                                {item.icon}
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </nav>
          )}

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />

            {/* Connection Status */}
            {!isSupabaseConnected && (
              <div className="badge badge-warning text-xs">
                Demo Mode
              </div>
            )}

            {userProfile ? (
              <div className="flex items-center gap-3">
                {/* Role Badge */}
                {getRoleBadge(userProfile.role)}
                
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block max-w-32 truncate">{userProfile.name}</span>
                    <FiChevronDown className="w-3 h-3 hidden lg:block" />
                  </button>
                  
                  {/* User Dropdown Menu */}
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 backdrop-blur-sm">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {userProfile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {userProfile.email}
                      </p>
                    </div>
                    <div className="p-2 space-y-1">
                      {authItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <FiLogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {authItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={isSupabaseConnected ? item.href : "/demo"}
                    className={`btn ${
                      index === 0 ? "btn-ghost" : "btn-primary"
                    } btn-sm ${!isSupabaseConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      if (!isSupabaseConnected) {
                        e.preventDefault();
                        console.log('Supabase not configured - running in demo mode');
                      }
                    }}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn btn-ghost btn-sm p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1">
                <span
                  className={`block h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
                ></span>
                <span
                  className={`block h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMenuOpen ? "max-h-screen opacity-100 pb-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Connection Status */}
            {!isSupabaseConnected && (
              <div className="px-3">
                <div className="badge badge-warning text-xs w-full justify-center py-2">
                  Demo Mode - Supabase Not Configured
                </div>
              </div>
            )}

            {/* User Info */}
            {userProfile && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {userProfile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {userProfile.email}
                      </p>
                    </div>
                  </div>
                  {getRoleBadge(userProfile.role)}
                </div>
              </div>
            )}

            {/* Main Navigation */}
            {userProfile && navigationItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                  Navigation
                </p>
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                        pathname === item.href
                          ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Auth Navigation */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                Account
              </p>
              <div className="space-y-1">
                {userProfile ? (
                  <>
                    {authItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <FiLogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  authItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={isSupabaseConnected ? item.href : "/demo"}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                        index === 0
                          ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          : "bg-primary-600 text-white hover:bg-primary-700"
                      } ${!isSupabaseConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClickCapture={(e) => {
                        if (!isSupabaseConnected) {
                          e.preventDefault();
                          setIsMenuOpen(false);
                          console.log('Supabase not configured - running in demo mode');
                        }
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}