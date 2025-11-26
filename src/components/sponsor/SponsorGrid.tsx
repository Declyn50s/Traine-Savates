import { Sponsor } from '../../types/api';

interface SponsorGridProps {
  sponsors: Sponsor[];
  category?: 'principal' | 'secondary';
}

export function SponsorGrid({ sponsors, category }: SponsorGridProps) {
  const baseSponsors = category
    ? sponsors.filter((s) => s.category === category)
    : sponsors;

  // On n’affiche que ceux qui ne sont pas explicitement masqués
  const filteredSponsors = baseSponsors.filter(
    (s) => s.is_visible !== false,
  );

  const gridClasses =
    category === 'principal'
      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
      : 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4';


  return (
    <div className={gridClasses}>
      {filteredSponsors.map((sponsor) => (
        <a
          key={sponsor.id}
          href={sponsor.website_url || '#'}
          target={sponsor.website_url ? '_blank' : undefined}
          rel={sponsor.website_url ? 'noopener noreferrer' : undefined}
          className="bg-white rounded-lg p-4 flex items-center justify-center hover:shadow-lg transition-shadow duration-200 border border-gray-200"
        >
          {sponsor.logo_asset_id ? (
            <img
              src={`/api/assets/${sponsor.logo_asset_id}`}
              alt={sponsor.name}
              className="max-w-full max-h-16 object-contain"
            />
          ) : (
            <span className="text-gray-700 font-semibold text-center text-sm">
              {sponsor.name}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
