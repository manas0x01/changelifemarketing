import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Business Plan', path: '/business-plan' },
    { name: 'Achievers', path: '/achievers' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <footer className="bg-[#0A6E5A] text-[#FFFFFF]">
      <div className="max-w-400 mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="https://static.wixstatic.com/media/38f579_7bb58bd4ae1c476fb919fba079c0fef7~mv2.png?originWidth=128&originHeight=128"
                alt="Change Life Marketing Logo"
                className="w-12 h-12"
                width={48}
                height={48}
              />
              <div>
                <h3 className="font-['Fraunces'] text-[1.25rem] text-[#C9A84C]">Change Life Marketing</h3>
              </div>
            </div>
            <p className="font-['Roboto'] text-[0.875rem] mb-4 text-[#F5A623]">
              Change Your Life, Change the World
            </p>
            <p className="font-['Roboto'] text-[0.875rem]">
              Empowering lives through natural health products and financial opportunities since November 2025.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-['Fraunces'] text-[1.25rem] text-[#C9A84C] mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="font-['Roboto'] text-[0.875rem] hover:text-[#C9A84C] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-['Fraunces'] text-[1.25rem] text-[#C9A84C] mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[#C9A84C] shrink-0 mt-1" />
                <span className="font-['Roboto'] text-[0.875rem]">
                  Ward No. 21, Holding No. 120, Dak Bangla Road, Masaurhi, Patna, Bihar - 804452
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#C9A84C]" />
                <span className="font-['Roboto'] text-[0.875rem]">+91 XXXXX XXXXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#C9A84C]" />
                <span className="font-['Roboto'] text-[0.875rem]">info@changelifemarketing.in</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-['Fraunces'] text-[1.25rem] text-[#C9A84C] mb-4">Follow Us</h4>
            <div className="flex gap-4 mb-6">
              <a
                href="#"
                className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center hover:bg-[#F5A623] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-[#FFFFFF]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center hover:bg-[#F5A623] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-[#FFFFFF]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center hover:bg-[#F5A623] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-[#FFFFFF]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center hover:bg-[#F5A623] transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5 text-[#FFFFFF]" />
              </a>
            </div>
            <p className="font-['Roboto'] text-[0.875rem]">
              Stay connected for updates, success stories, and exclusive offers.
            </p>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="border-t border-[#1B7A6B] pt-8 mb-8">
          <p className="font-['Roboto'] text-[0.875rem] text-center max-w-4xl mx-auto">
            <strong className="text-[#C9A84C]">Legal Disclaimer:</strong> Income and earnings depend on individual effort, team performance, and product sales. Results may vary. Change Life Marketing does not guarantee specific income levels. All business opportunities are subject to terms and conditions.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="font-['Roboto'] text-[0.875rem]">
            © 2026 Change Life Marketing. All rights reserved. | Website: www.changelifemarketing.in
          </p>
        </div>
      </div>
    </footer>
  );
}