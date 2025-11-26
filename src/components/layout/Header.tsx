import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Users, UserPlus } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'La course', href: '/la-course' },
    { name: 'Le club', href: '/le-club' },
    { name: 'Infos pratiques', href: '/infos-pratiques' },
    { name: 'Sponsors', href: '/sponsors' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:inline">
              Les Traîne-Savates
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/la-course"
              className="flex items-center gap-2 px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 font-semibold transition-colors"
            >
              <UserPlus size={18} />
              <span>S'inscrire</span>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/la-course"
                className="flex items-center justify-center gap-2 px-4 py-3 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-semibold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlus size={18} />
                <span>S'inscrire à la course</span>
              </Link>
              <Link
                to="/le-club/adherer"
                className="flex items-center justify-center gap-2 px-4 py-3 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 font-semibold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users size={18} />
                <span>Rejoindre le club</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
