import React, { useState, useEffect, useRef } from "react";
// Profile Icon Component
const ProfileIcon: React.FC = () => {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-8 h-8"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"
        fill="#4B5563"
      />
    </svg>
  );
};

// Hamburger Menu Icon Component
const HamburgerIcon: React.FC<{ onClick: () => void; className?: string }> = ({
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={`lg:hidden flex flex-col justify-center items-center w-10 h-10 space-y-1.5 focus:outline-none ${
        className || ""
      }`}
      aria-label="Toggle menu"
    >
      <span className="block w-6 h-0.5 bg-neutral-700"></span>
      <span className="block w-6 h-0.5 bg-neutral-700"></span>
      <span className="block w-6 h-0.5 bg-neutral-700"></span>
    </button>
  );
};

// Close Icon Component
const CloseIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center focus:outline-none"
      aria-label="Close menu"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 6L6 18"
          stroke="#4B5563"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 6L18 18"
          stroke="#4B5563"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

function Header({ currentPage, setCurrentPage }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Function to get display name for current page
  const getPageDisplayName = (page: string): string => {
    switch (page) {
      case "profile":
        return "Perfil";
      case "home":
        return "Inicio";
      case "about":
        return "Gobierno";
      case "admission":
        return "Admisiones";
      default:
        return "";
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    // Handle logout logic here
    console.log("Logging out...");
    setIsProfileDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="relative bg-white w-full">
      {/* Desktop Header */}
      <div className="flex items-center justify-between h-20 px-4 md:px-6 lg:px-0 bg-white">
        {/* Left section with logo */}
        <div className="flex items-center h-full">
          <div className="flex items-center h-full">
            <div className="flex flex-col justify-center items-center h-full bg-[#9F2241] rounded-[30px_0px_0px_0px]" style={{ width: '318px' }}>
              <img
                src="src\Assets\Logo\Secretaría de Educación Logo.png"
                alt="Primary Logo"
                className="object-contain max-w-full aspect-[4.52] w-[200px] md:w-[240px] cursor-pointer"
                onClick={() => handleNavClick("home")}
              />
            </div>
            <div
              className="h-full bg-[#B39040] w-[18px] md:w-[18px]"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Center section */}
        <div className="flex items-center space-x-6">
          {/* Secondary Logo */}
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/bc7f2278c149ae8500bc0f3cb4ff5d7a70fc0189?placeholderIfAbsent=true&apiKey=1b2c5865c57941bdb1e5e6d7d3efdada"
            alt="Secondary Logo"
            className="h-10 object-contain"
          />
          
          {/* Page Name Display */}
          {getPageDisplayName(currentPage) && (
            <div className="hidden lg:block">
              <h1 className="text-2xl font-semibold text-neutral-700">
                {getPageDisplayName(currentPage)}
              </h1>
            </div>
          )}
        </div>
        <div className="hidden lg:flex items-center space-x-11 ">
          {/* Navigation Menu - Horizontal line */}
          <nav className="flex items-center space-x-4 text-base text-neutral-700">
        
            <a
              href="#"
              onClick={() => handleNavClick("about")}
              className={`block py-2 hover:bg-gray-100 px-4 rounded-lg transition-colors ${
                currentPage === "about" ? "font-medium" : ""
              }`}
            >
              Gobierno
            </a>
            <a
              href="#"
              onClick={() => handleNavClick("home")}
              className={`block py-2 hover:bg-gray-100 px-4 rounded-lg transition-colors ${
                currentPage === "home" ? "font-medium" : ""
              }`}
            >
              Home
            </a>
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-6">
          {/* Profile Section - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-4 text-lg font-light text-neutral-700 relative" ref={dropdownRef}>
            <ProfileIcon />
            <button
              onClick={toggleProfileDropdown}
              className="hidden xl:flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
            >
              <p>Gerardo Miranda</p>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/6d0de60534a13e738ac412eba809bf68005c4261?placeholderIfAbsent=true&apiKey=1b2c5865c57941bdb1e5e6d7d3efdada"
                alt="Profile dropdown"
                className={`w-5 h-5 transition-transform ${
                  isProfileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            
            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  <button
                    onClick={() => handleNavClick("profile")}
                    className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Section - Hidden on small screens */}
          <div className="hidden md:flex items-center relative mr-5">
            {!isSearchOpen ? (
              <button
                onClick={toggleSearch}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/617b13f6b9071d92ee899630ab4bbaaeef41c0e6?placeholderIfAbsent=true&apiKey=1b2c5865c57941bdb1e5e6d7d3efdada"
                  alt="Search"
                  className="w-5 h-5"
                />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-800 focus:border-transparent"
                    autoFocus
                  />
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/617b13f6b9071d92ee899630ab4bbaaeef41c0e6?placeholderIfAbsent=true&apiKey=1b2c5865c57941bdb1e5e6d7d3efdada"
                    alt="Search"
                    className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2"
                  />
                </div>
                <button
                  onClick={toggleSearch}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18"
                      stroke="#4B5563"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 6L18 18"
                      stroke="#4B5563"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle - Only visible on mobile */}
          <HamburgerIcon onClick={toggleMobileMenu} className="lg:hidden" />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="relative p-6 min-h-screen flex flex-col">
            <CloseIcon onClick={toggleMobileMenu} />

            {/* Secondary Logo in Mobile Menu */}
            <div className="mt-12 mb-6 flex flex-col items-center space-y-4">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/bc7f2278c149ae8500bc0f3cb4ff5d7a70fc0189?placeholderIfAbsent=true&apiKey=1b2c5865c57941bdb1e5e6d7d3efdada"
                alt="Secondary Logo"
                className="h-10 object-contain"
              />
              
              {/* Page Name Display in Mobile */}
              {getPageDisplayName(currentPage) && (
                <h1 className="text-2xl font-semibold text-neutral-700">
                  {getPageDisplayName(currentPage)}
                </h1>
              )}
            </div>

            {/* Mobile Profile Section */}
            <div className="mb-8 px-4">
              <div className="flex items-center gap-4 mb-4">
                <ProfileIcon />
                <div className="flex-1">
                  <p className="text-lg font-light text-neutral-700">
                    Gerardo Miranda
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick("profile")}
                  className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  View Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>

            <hr className="border-gray-200 w-full my-4" />

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-6 px-4 mt-4">
              <button className="text-left text-xl font-medium text-neutral-700 py-2 border-b border-gray-100">
                Menu
              </button>
              <a
                href="/about"
                className="text-xl text-neutral-700 py-2 border-b border-gray-100"
              >
                Trámites
              </a>
              <a
                href="#"
                className="text-xl text-neutral-700 py-2 border-b border-gray-100"
              >
                Gobierno
              </a>
            </nav>

            {/* Mobile Search */}
            <div className="relative px-4 mt-8 mr-5">
              {!isSearchOpen ? (
                <button
                  onClick={toggleSearch}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/617b13f6b9071d92ee899630ab4bbaaeef41c0e6?placeholderIfAbsent=true&apiKey=1b2c5865c57941bdb1e5e6d7d3efdada"
                    alt="Search"
                    className="w-5 h-5"
                  />
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-800 focus:border-transparent"
                      autoFocus
                    />
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets/TEMP/617b13f6b9071d92ee899630ab4bbaaeef41c0e6?placeholderIfAbsent=true&apiKey=1b2c5865c57941bdb1e5e6d7d3efdada"
                      alt="Search"
                      className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2"
                    />
                  </div>
                  <button
                    onClick={toggleSearch}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="#4B5563"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="#4B5563"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
