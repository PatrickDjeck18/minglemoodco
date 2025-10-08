import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import LoginModal from './LoginModal';

interface NavbarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
  onLoginClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSectionChange, activeSection, onLoginClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDropdownToggle = (item: string) => {
    setActiveDropdown(activeDropdown === item ? null : item);
  };

  const handleNavClick = (section: string) => {
    onSectionChange(section);
    setIsMenuOpen(false);
    setActiveDropdown(null);
  };

  const navItems = [
    { name: 'Polityka i Misja', href: '#polityka', section: 'polityka' },
    { 
      name: 'Szkolenia', 
      href: '#szkolenia',
      section: 'szkolenia',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Wszystkie kursy', href: '#wszystkie-kursy', section: 'szkolenia' },
        { name: 'Kategorie', href: '#kategorie', section: 'szkolenia' },
        { name: 'Certyfikaty', href: '#certyfikaty', section: 'szkolenia' }
      ]
    },
    { name: 'Dla firm', href: '#dla-firm', section: 'dla-firm' },
    { name: 'Dla podmiotów publicznych', href: '#publiczne', section: 'publiczne' },
    { name: 'Cennik', href: '#cennik', section: 'cennik' },
    { name: 'Kontakt', href: '#kontakt', section: 'kontakt' }
  ];

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <button 
              onClick={() => handleNavClick('home')}
              className="flex items-center"
            >
              <img 
                src="/Logo Centrum Audytu New.svg" 
                alt="Logo Centrum Audytu" 
                className="h-12 w-auto"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                <button
                  className={`flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    activeSection === item.section 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={() => {
                    if (item.hasDropdown) {
                      handleDropdownToggle(item.name);
                    } else {
                      handleNavClick(item.section);
                    }
                  }}
                >
                  {item.name}
                  {item.hasDropdown && (
                    <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </button>
                
                {/* Dropdown Menu */}
                {item.hasDropdown && item.dropdownItems && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                    <div className="py-1">
                      {item.dropdownItems.map((dropdownItem) => (
                        <button
                          key={dropdownItem.name}
                          onClick={() => handleNavClick(dropdownItem.section)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                        >
                          {dropdownItem.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => {
                onLoginClick();
                setIsMenuOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Panel Kursanta
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-md transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 pt-2 pb-4 space-y-1 bg-white border-t border-gray-100">
          {navItems.map((item) => (
            <div key={item.name}>
              <button
                className={`flex items-center justify-between w-full text-left px-3 py-3 text-base font-medium rounded-md transition-colors duration-200 ${
                  activeSection === item.section 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
                onClick={() => {
                  if (item.hasDropdown) {
                    handleDropdownToggle(item.name);
                  } else {
                    handleNavClick(item.section);
                  }
                }}
              >
                {item.name}
                {item.hasDropdown && (
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                )}
              </button>
              
              {/* Mobile Dropdown */}
              {item.hasDropdown && item.dropdownItems && activeDropdown === item.name && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.dropdownItems.map((dropdownItem) => (
                    <button
                      key={dropdownItem.name}
                      onClick={() => handleNavClick(dropdownItem.section)}
                      className="block w-full text-left text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 text-sm rounded-md transition-colors duration-150"
                    >
                      {dropdownItem.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Panel Kursanta Button - Mobile */}
          <div className="pt-4 border-t border-gray-100">
            <button 
              onClick={() => {
                onLoginClick();
                setIsMenuOpen(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200"
            >
              Panel Kursanta
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;