import { usePracticalInfo, useFaq } from '../hooks/usePracticalInfo';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Section, SectionHeader } from '../components/ui/Section';
import { FaqAccordion } from '../components/faq/FaqAccordion';
import { MapPin, Train, Car, Utensils, ExternalLink } from 'lucide-react';

export function PracticalInfo() {
  const { data: info, loading: infoLoading, error: infoError } = usePracticalInfo();
  const { data: faq, loading: faqLoading, error: faqError } = useFaq();

  if (infoLoading || faqLoading) return <LoadingSpinner />;
  if (infoError || faqError)
    return <ErrorMessage message="Impossible de charger les informations pratiques" />;

  return (
    <div>
      <section className="bg-gradient-to-r from-green-600 to-green-500 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Infos pratiques</h1>
          <p className="text-xl md:text-2xl text-green-100">
            Toutes les informations pour votre venue
          </p>
        </div>
      </section>

      <Section background="white">
        <SectionHeader title="Lieu et accès" subtitle="Comment venir à Cheseaux" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-2">Adresse</h3>
                  <p className="text-gray-700 mb-3">
                    {info?.address || 'Place de fête, Cheseaux-sur-Lausanne'}
                  </p>
                  {info?.google_maps_url && (
                    <a
                      href={info.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
                    >
                      <ExternalLink size={16} />
                      <span>Voir sur Google Maps</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Train className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-2">En transports publics</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {info?.train_info ||
                      'LEB (Lausanne-Échallens-Bercher) toutes les 15 minutes. La place de fête se trouve à 3 minutes à pied de la gare de Cheseaux.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Car className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-2">En voiture</h3>
                  <p className="text-gray-700 mb-2">
                    {info?.car_info ||
                      "Accès facile depuis l'autoroute A1, sortie Lausanne-Vennes, puis direction Cheseaux."}
                  </p>
                  <p className="text-gray-700 font-semibold">
                    {info?.parking_info || 'Parking gratuit disponible à proximité.'}
                  </p>
                </div>
              </div>
            </div>

            {info?.facilities && (
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Utensils className="text-purple-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Services sur place</h3>
                    <p className="text-gray-700 leading-relaxed">{info.facilities}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-gray-200 rounded-lg overflow-hidden h-full min-h-[400px] flex items-center justify-center">
              {info?.google_maps_url ? (
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2743.5!2d6.6!3d46.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDbCsDM2JzAwLjAiTiA2wrAzNicwMC4wIkU!5e0!3m2!1sfr!2sch!4v1234567890`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '400px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Carte de localisation"
                ></iframe>
              ) : (
                <div className="text-center p-8">
                  <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">Carte non disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {faq && faq.length > 0 && (
        <Section background="gray">
          <SectionHeader
            title="Questions fréquentes"
            subtitle="Les réponses aux questions les plus courantes"
          />
          <div className="max-w-4xl mx-auto">
            <FaqAccordion items={faq} />
          </div>
        </Section>
      )}
    </div>
  );
}
