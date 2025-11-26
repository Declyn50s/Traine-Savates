import { useState } from 'react';
import { useActiveEdition } from '../hooks/useEdition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Section, SectionHeader } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { RaceCard } from '../components/race/RaceCard';
import { ProgramTimeline } from '../components/program/ProgramTimeline';
import { ExternalLink, Map, Download, Camera, Award } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

type RaceType = 'adult' | 'junior' | 'walking' | 'villageoise';

export function Course() {
  const { data: edition, loading: editionLoading, error: editionError } = useActiveEdition();
  const [selectedType, setSelectedType] = useState<RaceType>('adult');

  const {
    data: races,
    loading: racesLoading,
    error: racesError,
  } = useApi(() => (edition ? api.getRaces(edition.slug) : Promise.resolve([])), [edition?.slug]);

  const {
    data: program,
    loading: programLoading,
    error: programError,
  } = useApi(
    () => (edition ? api.getProgram(edition.slug) : Promise.resolve([])),
    [edition?.slug]
  );

  if (editionLoading || racesLoading || programLoading) return <LoadingSpinner />;
  if (editionError || racesError || programError)
    return <ErrorMessage message="Impossible de charger les données de la course" />;
  if (!edition || !races) return null;

  const tabs: { type: RaceType; label: string }[] = [
    { type: 'adult', label: 'Courses adultes' },
    { type: 'junior', label: 'Courses enfants' },
    { type: 'villageoise', label: 'Villageoise' },
    { type: 'walking', label: 'Walking & Marche' },
  ];

  const filteredRaces = races.filter((race) => race.type === selectedType);

  return (
    <div>
      <section className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{edition.title}</h1>
          <p className="text-xl md:text-2xl mb-6 text-orange-100">
            {new Date(edition.date).toLocaleDateString('fr-CH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {edition.registration_online_url && (
            <a href={edition.registration_online_url} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
                <ExternalLink className="mr-2" size={20} />
                S'inscrire en ligne
              </Button>
            </a>
          )}
        </div>
      </section>

      <Section background="white">
        <SectionHeader
          title="Les parcours"
          subtitle="Choisissez votre distance et découvrez les détails"
        />

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              onClick={() => setSelectedType(tab.type)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedType === tab.type
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRaces.map((race) => (
            <div key={race.id}>
              <RaceCard race={race} />
              {race.route_map_image_id && (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Map size={16} className="mr-1" />
                    Voir le plan
                  </Button>
                  {race.route_gpx_url && (
                    <a href={race.route_gpx_url} download>
                      <Button variant="outline" size="sm">
                        <Download size={16} />
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredRaces.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune course dans cette catégorie</p>
          </div>
        )}
      </Section>

      {program && program.length > 0 && (
        <Section background="gray">
          <SectionHeader
            title="Programme de la journée"
            subtitle="Horaires et déroulement de l'événement"
          />
          <div className="max-w-3xl mx-auto">
            <ProgramTimeline items={program} />
          </div>
        </Section>
      )}

      <Section background="white">
        <SectionHeader title="Résultats & photos" subtitle="Retrouvez vos performances" centered />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {edition.results_url && (
            <a
              href={edition.results_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition-shadow border-2 border-transparent hover:border-orange-600"
            >
              <Award className="mx-auto text-orange-600 mb-4" size={48} />
              <h3 className="font-bold text-xl mb-2">Voir les résultats</h3>
              <p className="text-gray-600 text-sm">Consultez les classements officiels</p>
            </a>
          )}
          {edition.photos_album_url && (
            <a
              href={edition.photos_album_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition-shadow border-2 border-transparent hover:border-orange-600"
            >
              <Camera className="mx-auto text-orange-600 mb-4" size={48} />
              <h3 className="font-bold text-xl mb-2">Voir les photos</h3>
              <p className="text-gray-600 text-sm">Revivez l'ambiance en images</p>
            </a>
          )}
        </div>
      </Section>
    </div>
  );
}
