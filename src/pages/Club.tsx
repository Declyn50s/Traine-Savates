import { Link } from 'react-router-dom';
import { useClubData } from '../hooks/useClub';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Section, SectionHeader } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { TrainingCard } from '../components/training/TrainingCard';
import { CommitteeMemberCard } from '../components/club/CommitteeMemberCard';
import { Users, Calendar, Heart } from 'lucide-react';

export function Club() {
  const { data, loading, error } = useClubData();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Impossible de charger les données du club" />;
  if (!data) return null;

  const { content, training_sessions, committee_members } = data;

  const trainingByCategory = {
    adult: training_sessions.filter((s) => s.category === 'adult'),
    junior: training_sessions.filter((s) => s.category === 'junior'),
    nordic: training_sessions.filter((s) => s.category === 'nordic'),
    prep_20km: training_sessions.filter((s) => s.category === 'prep_20km'),
  };

  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Le club</h1>
          <p className="text-xl md:text-2xl text-blue-100">
            Course à pied, convivialité et dépassement de soi
          </p>
        </div>
      </section>

      <Section background="white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {content.members_count && (
            <div className="bg-orange-50 rounded-lg p-6 text-center">
              <Users className="mx-auto text-orange-600 mb-3" size={48} />
              <p className="text-4xl font-bold text-gray-900 mb-1">{content.members_count}</p>
              <p className="text-gray-700">membres actifs</p>
            </div>
          )}
          {content.founded_year && (
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <Calendar className="mx-auto text-blue-600 mb-3" size={48} />
              <p className="text-4xl font-bold text-gray-900 mb-1">
                {new Date().getFullYear() - content.founded_year}+
              </p>
              <p className="text-gray-700">ans d'existence</p>
            </div>
          )}
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <Heart className="mx-auto text-green-600 mb-3" size={48} />
            <p className="text-4xl font-bold text-gray-900 mb-1">100%</p>
            <p className="text-gray-700">passion et convivialité</p>
          </div>
        </div>

        {content.club_intro && (
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg text-gray-700 leading-relaxed text-center">
              {content.club_intro}
            </p>
          </div>
        )}

        {content.club_history && (
          <div className="max-w-4xl mx-auto bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Notre histoire</h2>
            <p className="text-gray-700 leading-relaxed">{content.club_history}</p>
          </div>
        )}
      </Section>

      <Section background="gray">
        <SectionHeader
          title="Les entraînements"
          subtitle="Plusieurs séances par semaine pour tous les niveaux"
        />

        {trainingByCategory.adult.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Adultes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingByCategory.adult.map((session) => (
                <TrainingCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {trainingByCategory.junior.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Juniors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingByCategory.junior.map((session) => (
                <TrainingCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {trainingByCategory.nordic.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Nordic Walking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingByCategory.nordic.map((session) => (
                <TrainingCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        {trainingByCategory.prep_20km.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Préparation 20 km</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingByCategory.prep_20km.map((session) => (
                <TrainingCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/le-club/adherer">
            <Button variant="primary" size="lg">
              Rejoindre le club
            </Button>
          </Link>
        </div>
      </Section>

      {committee_members.length > 0 && (
        <Section background="white">
          <SectionHeader title="Le comité" subtitle="Les personnes qui font vivre le club" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {committee_members.map((member) => (
              <CommitteeMemberCard key={member.id} member={member} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
