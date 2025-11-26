import { Link } from 'react-router-dom';
import { Mail, Instagram, Facebook, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Les Traîne-Savates</h3>
            <p className="text-sm leading-relaxed mb-4">
              Course populaire et club de course à pied à Cheseaux-sur-Lausanne.
            </p>
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={18} className="flex-shrink-0 mt-1" />
              <span>Cheseaux-sur-Lausanne</span>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/la-course" className="text-sm hover:text-orange-400 transition-colors">
                  La course
                </Link>
              </li>
              <li>
                <Link to="/le-club" className="text-sm hover:text-orange-400 transition-colors">
                  Le club
                </Link>
              </li>
              <li>
                <Link
                  to="/infos-pratiques"
                  className="text-sm hover:text-orange-400 transition-colors"
                >
                  Infos pratiques
                </Link>
              </li>
              <li>
                <Link to="/sponsors" className="text-sm hover:text-orange-400 transition-colors">
                  Sponsors
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-orange-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Suivez-nous</h3>
            <div className="flex gap-4 mb-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
            <a
              href="mailto:info@traine-savates.ch"
              className="flex items-center gap-2 text-sm hover:text-orange-400 transition-colors"
            >
              <Mail size={18} />
              <span>info@traine-savates.ch</span>
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-sm text-center">
            © {new Date().getFullYear()} Les Traîne-Savates. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
