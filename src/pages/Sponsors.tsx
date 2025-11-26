// src/pages/Sponsors.tsx
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api'; // ⚠️ adapte si ton service a un autre nom
// Si tu as déjà un type Sponsor global, tu peux remplacer ce type local par un import.
type Sponsor = {
  id: string;
  name: string;
  category: 'principal' | 'secondary' | string | null;
  website_url?: string | null;
  logo_asset_id?: string | null;
  order_index?: number | null;
};

type SponsorsByCategory = {
  principal: Sponsor[];
  secondary: Sponsor[];
  other: Sponsor[];
};

function getLogoUrl(logo_asset_id?: string | null): string | null {
  if (!logo_asset_id) return null;
  if (logo_asset_id.startsWith('http://') || logo_asset_id.startsWith('https://')) {
    return logo_asset_id;
  }

  const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(logo_asset_id);
  return data?.publicUrl ?? null;
}

export function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // ⚠️ Adapte ce call si ton service a un nom différent
        const data = await api.getSponsors();
        if (!mounted) return;
        setSponsors(data);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError("Impossible de charger les sponsors pour l'instant.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const grouped: SponsorsByCategory = useMemo(() => {
    const principal: Sponsor[] = [];
    const secondary: Sponsor[] = [];
    const other: Sponsor[] = [];

    const sorted = [...sponsors].sort((a, b) => {
      const ao = a.order_index ?? 0;
      const bo = b.order_index ?? 0;
      return ao - bo;
    });

    for (const s of sorted) {
      if (s.category === 'principal') principal.push(s);
      else if (s.category === 'secondary') secondary.push(s);
      else other.push(s);
    }

    return { principal, secondary, other };
  }, [sponsors]);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-orange-50/70 to-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              Nos partenaires
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ils font vivre les Traîne-Savates
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600">
              La course et le club existent grâce au soutien de partenaires locaux et régionaux.
              Merci à eux pour leur engagement, leur confiance et leur fidélité.
            </p>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {loading && (
          <div className="py-12 text-center text-sm text-gray-500">
            Chargement des sponsors…
          </div>
        )}

        {error && !loading && (
          <div className="mb-8 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && sponsors.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500">
            Aucun sponsor n&apos;est encore enregistré.  
            Cette section s&apos;alimentera automatiquement dès que tu auras ajouté des sponsors
            dans l&apos;interface admin.
          </div>
        )}

        {!loading && sponsors.length > 0 && (
          <div className="space-y-10">
            {/* SPONSORS PRINCIPAUX */}
            {grouped.principal.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sponsors principaux
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Nos partenaires majeurs, qui soutiennent durablement la course et le club.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-start gap-6">
                  {grouped.principal.map((sponsor) => {
                    const logoUrl = getLogoUrl(sponsor.logo_asset_id);
                    const content = (
                      <div className="group flex h-24 w-40 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={sponsor.name ?? 'Sponsor'}
                            className="max-h-16 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs font-medium text-gray-500 text-center">
                            {sponsor.name}
                          </span>
                        )}
                      </div>
                    );

                    return sponsor.website_url ? (
                      <a
                        key={sponsor.id}
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={sponsor.id}>{content}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SPONSORS SECONDAIRES */}
            {grouped.secondary.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sponsors secondaires
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Des entreprises et commerces qui soutiennent la course et les coureurs.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {grouped.secondary.map((sponsor) => {
                    const logoUrl = getLogoUrl(sponsor.logo_asset_id);
                    const content = (
                      <div className="group flex h-20 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={sponsor.name ?? 'Sponsor'}
                            className="max-h-14 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[11px] font-medium text-gray-500 text-center">
                            {sponsor.name}
                          </span>
                        )}
                      </div>
                    );

                    return sponsor.website_url ? (
                      <a
                        key={sponsor.id}
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={sponsor.id}>{content}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AUTRES / NON CATÉGORISÉS */}
            {grouped.other.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Partenaires &amp; soutiens
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Autres organisations et partenaires qui contribuent à la réussite de
                    l&apos;événement.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {grouped.other.map((sponsor) => {
                    const logoUrl = getLogoUrl(sponsor.logo_asset_id);
                    const content = (
                      <div className="group flex h-20 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={sponsor.name ?? 'Sponsor'}
                            className="max-h-14 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[11px] font-medium text-gray-500 text-center">
                            {sponsor.name}
                          </span>
                        )}
                      </div>
                    );

                    return sponsor.website_url ? (
                      <a
                        key={sponsor.id}
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={sponsor.id}>{content}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TEXTE DE REMERCIEMENT */}
            <div className="mt-6 border-t border-gray-100 pt-6 text-xs sm:text-sm text-gray-500">
              Merci à tous les partenaires qui soutiennent les Traîne-Savates, la course et le
              club.  
              Pour devenir sponsor, n’hésite pas à nous contacter via le formulaire ou par e-mail.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Sponsors;
