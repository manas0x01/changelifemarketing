import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const isAdmin = session?.user?.role === 'admin';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Business Plan', path: '/businessplans' },
    { name: 'Achievers', path: '/achievers' },
    { name: 'Legal Documents', path: '/legal' },
    { name: 'Contact', path: '/contact' },
  ];

  const adminLinks = [
    { name: 'Create Epin', path: '/admin/createepin' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Withdraw Requests', path: '/admin/withdrawrequests' },
    { name: 'Achievers', path: '/admin/achievers' },
    {name:'Orders', path: '/admin/orders'},
  ];

  const isActive = (path: string) => {
    if (path.includes('#')) {
      return pathname === '/' && typeof window !== 'undefined' && window.location.hash === `#${path.split('#')[1]}`;
    }
    return pathname === path;
  };

  const handleNavClick = (path: string) => {
    setIsMenuOpen(false);
    if (path.includes('#')) {
      setTimeout(() => {
        const element = document.getElementById(path.split('#')[1]);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] shadow-md">
      <div className="max-w-400 mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/changelifemarketinglogo.png"
              alt="Change Life Marketing Logo"
              className="w-12 h-12"
              width={48}
              height={48}
            />
            <div>
              <h1 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A]">Change Life Marketing</h1>
              <p className="font-['Roboto'] text-[0.75rem] text-[#333333]">Change Your Life, Change the World</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`font-['Roboto'] font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-[#C9A84C]'
                    : 'text-[#333333] hover:text-[#0A6E5A]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Admin Dropdown - Only for Admin Users */}
            {isAdmin && (
              <div className="relative group">
                <button className="flex items-center gap-2 font-['Roboto'] font-medium text-[#333333] hover:text-[#0A6E5A] transition-colors">
                  Admin
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#ddd] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`block px-4 py-3 font-['Roboto'] text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-[#f5f5f5] ${
                        isActive(link.path)
                          ? 'text-[#C9A84C] bg-[#f9f9f9]'
                          : 'text-[#333333]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link href="/auth/login">
              <button suppressHydrationWarning={true} className="bg-[#C9A84C] text-[#FFFFFF] px-6 py-3 rounded-lg font-['Roboto'] font-semibold hover:bg-[#F5A623] transition-colors">
                Login
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-[#0A6E5A]"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-6 pb-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`block font-['Roboto'] font-medium py-2 transition-colors ${
                  isActive(link.path)
                    ? 'text-[#C9A84C]'
                    : 'text-[#333333] hover:text-[#0A6E5A]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Admin Dropdown - Mobile */}
            {isAdmin && (
              <div>
                <button
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                  className="flex items-center gap-2 font-['Roboto'] font-medium text-[#333333] hover:text-[#0A6E5A] py-2 w-full transition-colors"
                >
                  Admin
                  <ChevronDown className={`w-4 h-4 transition-transform ${isAdminDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isAdminDropdownOpen && (
                  <div className="ml-4 space-y-2 mt-2 border-l-2 border-[#C9A84C] pl-4">
                    {adminLinks.map((link) => (
                      <Link
                        key={link.path}
                        href={link.path}
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsAdminDropdownOpen(false);
                        }}
                        className={`block font-['Roboto'] text-sm py-2 transition-colors ${
                          isActive(link.path)
                            ? 'text-[#C9A84C]'
                            : 'text-[#333333] hover:text-[#0A6E5A]'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
              <button suppressHydrationWarning={true} className="w-full bg-[#C9A84C] text-[#FFFFFF] px-6 py-3 rounded-lg font-['Roboto'] font-semibold hover:bg-[#F5A623] transition-colors">
                Login
              </button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}