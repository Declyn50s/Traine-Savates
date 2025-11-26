import { useState, FormEvent } from 'react';
import { Section, SectionHeader } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { MembershipFormData } from '../types/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function Membership() {
  const [formData, setFormData] = useState<MembershipFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    address: '',
    city: '',
    postal_code: '',
    membership_type: 'adult',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await api.submitMembership(formData);
      setStatus('success');
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        birth_date: '',
        address: '',
        city: '',
        postal_code: '',
        membership_type: 'adult',
        message: '',
      });
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur lors de l'envoi de votre demande"
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Adhérer au club</h1>
          <p className="text-xl md:text-2xl text-blue-100">
            Rejoignez-nous pour partager votre passion de la course
          </p>
        </div>
      </section>

      <Section background="white">
        <div className="max-w-3xl mx-auto">
          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <CheckCircle2 className="mx-auto text-green-600 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-green-900 mb-3">
                Demande envoyée avec succès
              </h2>
              <p className="text-green-800 mb-6">
                Merci pour votre intérêt ! Nous avons bien reçu votre demande d'adhésion. Un membre
                du comité vous contactera prochainement pour finaliser votre inscription.
              </p>
              <Button onClick={() => setStatus('idle')} variant="primary">
                Nouvelle demande
              </Button>
            </div>
          ) : (
            <>
              <SectionHeader
                title="Formulaire d'adhésion"
                subtitle="Remplissez le formulaire ci-dessous pour nous rejoindre"
              />

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-semibold mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-semibold mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="birth_date" className="block text-sm font-semibold mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    id="birth_date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-semibold mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold mb-2">
                      Localité
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="membership_type" className="block text-sm font-semibold mb-2">
                    Type d'adhésion *
                  </label>
                  <select
                    id="membership_type"
                    name="membership_type"
                    value={formData.membership_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="adult">Adultes - Course à pied</option>
                    <option value="junior">Juniors</option>
                    <option value="nordic">Nordic Walking</option>
                    <option value="prep_20km">Préparation 20 km de Lausanne</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold mb-2">
                    Message (optionnel)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Parlez-nous de votre expérience, vos objectifs..."
                  />
                </div>

                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">Erreur</h3>
                      <p className="text-red-700 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={status === 'loading'}
                    className="min-w-[200px]"
                  >
                    {status === 'loading' ? 'Envoi en cours...' : 'Envoyer ma demande'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </Section>
    </div>
  );
}
