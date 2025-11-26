import { useState, FormEvent } from 'react';
import { Section, SectionHeader } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { ContactFormData } from '../types/api';
import { CheckCircle2, AlertCircle, Mail, Phone, MapPin } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await api.submitContact(formData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Erreur lors de l\'envoi de votre message'
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
      <section className="bg-gradient-to-r from-gray-700 to-gray-600 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact</h1>
          <p className="text-xl md:text-2xl text-gray-200">
            Une question ? N'hésitez pas à nous contacter
          </p>
        </div>
      </section>

      <Section background="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations de contact</h2>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <Mail className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Email</h3>
                  <a
                    href="mailto:info@traine-savates.ch"
                    className="text-gray-700 hover:text-orange-600"
                  >
                    info@traine-savates.ch
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Téléphone</h3>
                  <a href="tel:+41211234567" className="text-gray-700 hover:text-orange-600">
                    +41 21 123 45 67
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Adresse</h3>
                  <p className="text-gray-700">
                    Les Traîne-Savates
                    <br />
                    Cheseaux-sur-Lausanne
                    <br />
                    Suisse
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3">Horaires</h3>
              <p className="text-gray-700 mb-2">
                Notre comité est bénévole. Nous faisons notre possible pour répondre rapidement à
                vos messages.
              </p>
              <p className="text-gray-600 text-sm">
                Délai de réponse habituel : 24-48h (jours ouvrables)
              </p>
            </div>
          </div>

          <div>
            {status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <CheckCircle2 className="mx-auto text-green-600 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-green-900 mb-3">Message envoyé</h2>
                <p className="text-green-800 mb-6">
                  Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.
                </p>
                <Button onClick={() => setStatus('idle')} variant="primary">
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <>
                <SectionHeader title="Formulaire de contact" subtitle="Envoyez-nous un message" />

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold mb-2">
                      Sujet *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={status === 'loading'}
                      className="min-w-[200px]"
                    >
                      {status === 'loading' ? 'Envoi en cours...' : 'Envoyer'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
