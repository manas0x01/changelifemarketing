import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Business Plan', path: '/businessplans' },
    { name: 'Achievers', path: '/achievers' },
    { name: 'Legal Documents', path: '/legal' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Contact', path: '/contact' },
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

  const handleDashboardClick = () => {
    if (!session) {
      // Not logged in, go to login
      router.push('/auth/login');
    } else {
      // Logged in, check role
      const role = session.user?.role;
      if (role === 'admin') {
        router.push('/clm-portal/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] shadow-md">
      <div className="max-w-400 mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/clm-new-logo.png"
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
          </nav>
          {/* CTA Button */}
          <div className="hidden lg:block">
            <button
              onClick={handleDashboardClick}
              suppressHydrationWarning={true}
              className="bg-[#C9A84C] text-[#FFFFFF] px-6 py-3 rounded-lg font-['Roboto'] font-semibold hover:bg-[#F5A623] transition-colors"
            >
              {session ? 'Dashboard' : 'Login'}
            </button>
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
            
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleDashboardClick();
              }}
              suppressHydrationWarning={true}
              className="w-full bg-[#C9A84C] text-[#FFFFFF] px-6 py-3 rounded-lg font-['Roboto'] font-semibold hover:bg-[#F5A623] transition-colors"
            >
              {session ? 'Dashboard' : 'Login'}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}