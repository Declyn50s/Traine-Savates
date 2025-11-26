import { Link } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Section, SectionHeader } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { RaceCard } from '../components/race/RaceCard';
import { SponsorGrid } from '../components/sponsor/SponsorGrid';
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react';

export function Home() {
  const { data, loading, error } = useHomeData();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Impossible de charger les données" />;
  if (!data) return null;

  const { edition, featured_races, club_excerpt, main_sponsors, practical_info_excerpt } = data;

  return (
    <div>
      <section className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-20 md:py-32">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Les Traîne-Savates
            </h1>
            <p className="text-xl md:text-2xl mb-2 text-orange-100">
              Course populaire & club de course à Cheseaux
            </p>

            {edition && (
              <div className="flex items-center gap-3 mb-8">
                <Calendar size={24} />
                <p className="text-lg md:text-xl font-semibold">
                  Prochaine édition : {new Date(edition.date).toLocaleDateString('fr-CH')} –{' '}
                  {edition.edition_number}
                  <sup>e</sup> édition
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/la-course">
                <Button size="lg" variant="primary" className="w-full sm:w-auto">
                  Infos & inscriptions
                </Button>
              </Link>
              <Link to="/le-club/adherer">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white hover:text-orange-600"
                >
                  Rejoindre le club
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section background="white">
        <SectionHeader
          title="La course"
          subtitle="Plusieurs parcours pour tous les niveaux et tous les âges"
          centered
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured_races?.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              onDetailsClick={() => (window.location.href = '/la-course')}
            />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/la-course">
            <Button variant="primary">Voir tous les parcours</Button>
          </Link>
        </div>
      </Section>

      <Section background="orange">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Le club</h2>
            {club_excerpt?.club_intro && (
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">{club_excerpt.club_intro}</p>
            )}
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <Users className="mx-auto text-orange-600 mb-2" size={32} />
                <p className="text-3xl font-bold text-gray-900">
                  {club_excerpt?.members_count || '200+'}
                </p>
                <p className="text-sm text-gray-600">membres</p>
              </div>
              {club_excerpt?.founded_year && (
                <div className="bg-white rounded-lg shadow-md p-4 text-center">
                  <Calendar className="mx-auto text-orange-600 mb-2" size={32} />
                  <p className="text-3xl font-bold text-gray-900">{club_excerpt.founded_year}</p>
                  <p className="text-sm text-gray-600">année de création</p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/le-club/entrainements">
                <Button variant="primary">Voir les entraînements</Button>
              </Link>
              <Link to="/le-club/adherer">
                <Button variant="secondary">Adhérer au club</Button>
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Pourquoi nous rejoindre ?</h3>
            <ul className="space-y-3">
              {[
                'Entraînements encadrés plusieurs fois par semaine',
                'Ambiance conviviale et esprit de groupe',
                'Préparation aux courses populaires',
                'Tous niveaux acceptés',
                'Sections adultes, juniors et nordic walking',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section background="gray">
        <SectionHeader
          title="Infos pratiques"
          subtitle="Accès facile en transports publics ou en voiture"
          centered
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <MapPin className="mx-auto text-orange-600 mb-3" size={40} />
            <h3 className="font-bold text-lg mb-2">Lieu</h3>
            <p className="text-gray-700 text-sm">
              {practical_info_excerpt?.address || 'Place de fête, Cheseaux-sur-Lausanne'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Calendar className="mx-auto text-orange-600 mb-3" size={40} />
            <h3 className="font-bold text-lg mb-2">En train</h3>
            <p className="text-gray-700 text-sm">
              LEB toutes les 15 min
              <br />3 min de la gare à pied
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <ExternalLink className="mx-auto text-orange-600 mb-3" size={40} />
            <h3 className="font-bold text-lg mb-2">En voiture</h3>
            <p className="text-gray-700 text-sm">
              Parking disponible
              <br />
              Accès facile depuis l'autoroute
            </p>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link to="/infos-pratiques">
            <Button variant="outline">Voir toutes les infos pratiques</Button>
          </Link>
        </div>
      </Section>

      {main_sponsors && main_sponsors.length > 0 && (
        <Section background="white">
          <SectionHeader title="Nos partenaires" subtitle="Ils nous soutiennent" centered />
          <SponsorGrid sponsors={main_sponsors} />
          <div className="text-center mt-8">
            <Link to="/sponsors">
              <Button variant="outline">Voir tous les sponsors</Button>
            </Link>
          </div>
        </Section>
      )}
    </div>
  );
}
