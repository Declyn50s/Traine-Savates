// src/pages/admin/PracticalInfoAdmin.tsx
import { useEffect, useMemo, useState, FormEvent } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import type { PracticalInfo, FaqItem } from '../../types/api';
import {
  MapPin,
  HelpCircle,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Search,
  RefreshCw,
} from 'lucide-react';

function formatDate(dateString?: string | null) {
  if (!dateString) return 'Jamais enregistré';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'Date inconnue';
  return d.toLocaleString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PracticalInfoAdmin() {
  const [loading, setLoading] = useState(true);

  const [info, setInfo] = useState<PracticalInfo | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);

  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [savingFaqId, setSavingFaqId] = useState<string | null>(null);

  const [newFaq, setNewFaq] = useState<Partial<FaqItem>>({
    question: '',
    answer: '',
    category: '',
    order_index: 0,
  });

  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('all');

  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      let practical: PracticalInfo | null = null;
      try {
        practical = await adminApi.getPracticalInfo();
      } catch {
        // Première fois → on part avec un objet vide
        practical = {
          id: '' as any,
          address: '',
          google_maps_url: '',
          train_info: '',
          car_info: '',
          parking_info: '',
          facilities: '',
          updated_at: null as any,
        } as PracticalInfo;
      }

      const faqItems = await adminApi.getFaqItems();

      setInfo(practical);
      setFaq(faqItems);
    } finally {
      setLoading(false);
    }
  }

  // ———————————————
  // INFOS PRATIQUES
  // ———————————————

  function updateInfoField<K extends keyof PracticalInfo>(field: K, value: PracticalInfo[K]) {
    setInfo((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    if (!info) return;

    // Minimum vital : adresse
    if (!info.address || info.address.trim().length < 5) {
      alert("L'adresse doit être renseignée (au minimum la localité).");
      return;
    }

    setSavingInfo(true);
    try {
      const { id, updated_at, ...updates } = info as any;
      const saved = await adminApi.updatePracticalInfo(updates);
      setInfo(saved);
    } finally {
      setSavingInfo(false);
    }
  }

  // ———————————————
  // FAQ
  // ———————————————

  function updateFaqField(id: string, field: keyof FaqItem, value: any) {
    setFaq((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  async function handleSaveFaq(item: FaqItem) {
    setSavingFaqId(item.id);
    try {
      const { id, created_at, ...updates } = item as any;
      const updated = await adminApi.updateFaqItem(id, updates);
      setFaq((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } finally {
      setSavingFaqId(null);
    }
  }

  async function handleDeleteFaq(id: string) {
    if (!window.confirm('Supprimer définitivement cette question ?')) return;
    await adminApi.deleteFaqItem(id);
    setFaq((prev) => prev.filter((f) => f.id !== id));
    if (expandedFaqId === id) setExpandedFaqId(null);
  }

  function updateNewFaq(field: keyof FaqItem, value: any) {
    setNewFaq((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateFaq(e: FormEvent) {
    e.preventDefault();
    if (!newFaq.question || !newFaq.answer) {
      alert('Question et réponse sont obligatoires.');
      return;
    }

    const created = await adminApi.createFaqItem(newFaq);
    setFaq((prev) => [...prev, created]);
    setNewFaq({
      question: '',
      answer: '',
      category: '',
      order_index: (created as any).order_index ?? 0,
    });
    setExpandedFaqId(created.id);
  }

  const faqCategories = useMemo(() => {
    const set = new Set<string>();
    faq.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set).sort();
  }, [faq]);

  const filteredFaq = useMemo(() => {
    const term = faqSearch.trim().toLowerCase();

    return faq
      .filter((item) => {
        if (faqCategoryFilter !== 'all' && item.category !== faqCategoryFilter) return false;
        if (!term) return true;
        return (
          item.question.toLowerCase().includes(term) ||
          (item.answer ?? '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const ao = (a as any).order_index ?? 0;
        const bo = (b as any).order_index ?? 0;
        return ao - bo;
      });
  }, [faq, faqSearch, faqCategoryFilter]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (!info) {
    return (
      <AdminLayout>
        <div className="py-12 text-sm text-red-600">
          Impossible de charger les informations pratiques. Vérifie Supabase / les RLS.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* HEADER */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-orange-600" />
            Infos pratiques &amp; FAQ
          </h1>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              Dernière mise à jour&nbsp;:{' '}
              <span className="font-medium">
                {formatDate(info.updated_at as any)}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Recharger
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 max-w-3xl">
          Tout ce que tu saisis ici est utilisé sur la page publique
          <span className="font-semibold"> « Infos pratiques »</span> et dans l&apos;accordéon{' '}
          <span className="font-semibold">FAQ</span>. L’objectif&nbsp;: que les coureurs
          trouvent l’info clé en quelques secondes.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* COLONNE GAUCHE : INFOS PRATIQUES */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Lieu, accès &amp; infrastructures</h2>
                <p className="text-sm text-gray-500">
                  Adresse officielle, comment venir, se parquer et ce qu&apos;on trouve sur place.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveInfo} className="space-y-5">
              {/* Adresse + lien maps */}
              <div className="space-y-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    Adresse &amp; plan
                  </span>
                  {info.google_maps_url && (
                    <a
                      href={info.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-orange-700 hover:text-orange-800 underline"
                    >
                      Ouvrir dans Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Indique l&apos;adresse complète de la zone de départ/arrivée (ou du centre
                  névralgique de la course).
                </p>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  rows={2}
                  value={info.address || ''}
                  onChange={(e) => updateInfoField('address', e.target.value)}
                  placeholder={`p. ex.\nCollège de Cheseaux\nRue du Centre 1\n1033 Cheseaux-sur-Lausanne`}
                />

                <label className="block text-xs font-medium text-gray-700 mt-2 mb-1">
                  Lien Google Maps (optionnel)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={info.google_maps_url || ''}
                  onChange={(e) => updateInfoField('google_maps_url', e.target.value)}
                  placeholder="https://maps.google.com/…"
                />
              </div>

              {/* Transports publics */}
              <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                <div className="text-sm font-medium text-gray-800">
                  Accès en transports publics
                </div>
                <p className="text-xs text-gray-500">
                  Donne les lignes/lignes TL, arrêt, fréquence, temps de marche. Fais court et
                  concret.
                </p>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  value={info.train_info || ''}
                  onChange={(e) => updateInfoField('train_info', e.target.value)}
                  placeholder={`p. ex.\n• LEB, arrêt « Cheseaux » puis 5 minutes à pied\n• Bus TL 54, arrêt « Cheseaux-Gare »…`}
                />
              </div>

              {/* Accès voiture */}
              <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                <div className="text-sm font-medium text-gray-800">Accès en voiture</div>
                <p className="text-xs text-gray-500">
                  Infos de base pour arriver sans galérer (sortie d&apos;autoroute, sens unique,
                  routes fermées le jour J).
                </p>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  value={info.car_info || ''}
                  onChange={(e) => updateInfoField('car_info', e.target.value)}
                  placeholder={`p. ex.\n• Sortie A1 « Lausanne-Blécherette », direction Cheseaux\n• Le jour de la course, certaines routes du village sont fermées…`}
                />
              </div>

              {/* Parking / Infrastructures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                  <div className="text-sm font-medium text-gray-800">Parkings</div>
                  <p className="text-xs text-gray-500">
                    Où parquer, payant/gratuit, distance à pied. Tu peux utiliser des puces.
                  </p>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                    value={info.parking_info || ''}
                    onChange={(e) => updateInfoField('parking_info', e.target.value)}
                    placeholder={`p. ex.\n• Parking collège, gratuit, 50 places\n• Parking Coop, limité à 2h…`}
                  />
                </div>

                <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                  <div className="text-sm font-medium text-gray-800">
                    Infrastructures &amp; restauration
                  </div>
                  <p className="text-xs text-gray-500">
                    Vestiaires, douches, garderie, stand boissons/mets, WC, etc.
                  </p>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                    value={info.facilities || ''}
                    onChange={(e) => updateInfoField('facilities', e.target.value)}
                    placeholder={`p. ex.\n• Vestiaires et douches au collège\n• Stand boissons et petite restauration à la cantine\n• Garderie pour les enfants dès 3 ans…`}
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Astuce&nbsp;: pense en mode coureur qui vient pour la première fois. Tout ce
                  qui enlève du stress avant le jour J est utile.
                </p>
                <Button type="submit" variant="primary" disabled={savingInfo}>
                  {savingInfo ? 'Enregistrement…' : 'Enregistrer les infos pratiques'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* COLONNE DROITE : FAQ */}
        <Card className="max-h-[900px] flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-orange-600" />
                  FAQ – Questions fréquentes
                </h2>
                <p className="text-sm text-gray-500">
                  Réponds aux questions les plus courantes : inscriptions, remboursements, météo,
                  parkings…
                </p>
              </div>
            </div>
            {/* Barre de recherche + filtre */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
                <input
                  className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm"
                  placeholder="Rechercher (question ou réponse)…"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                />
              </div>
              <select
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-700"
                value={faqCategoryFilter}
                onChange={(e) => setFaqCategoryFilter(e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                {faqCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-gray-500">
                {filteredFaq.length} question(s) affichée(s)
              </span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4">
            {/* Liste des FAQ */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {filteredFaq.length === 0 && (
                <div className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-md px-3 py-4">
                  Aucune question pour ces filtres. Modifie la recherche ou ajoute une nouvelle
                  entrée en bas.
                </div>
              )}

              {filteredFaq.map((item) => {
                const isExpanded = expandedFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg bg-white text-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedFaqId((cur) => (cur === item.id ? null : item.id))
                      }
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-gray-900 line-clamp-1">
                          {item.question || <span className="italic text-gray-400">Sans titre</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          {item.category && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                              {item.category}
                            </span>
                          )}
                          <span>Ordre : {(item as any).order_index ?? 0}</span>
                          <span className="text-gray-400">ID: {item.id.slice(0, 6)}…</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {isExpanded ? 'Fermer' : 'Modifier'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 px-3 py-3 space-y-3 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Question
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={item.question || ''}
                              onChange={(e) =>
                                updateFaqField(item.id, 'question', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Catégorie (optionnel)
                            </label>
                            <input
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={item.category || ''}
                              onChange={(e) =>
                                updateFaqField(item.id, 'category', e.target.value)
                              }
                              placeholder="p. ex. Inscriptions, Parcours, Remboursement…"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Réponse
                          </label>
                          <textarea
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                            rows={3}
                            value={item.answer || ''}
                            onChange={(e) =>
                              updateFaqField(item.id, 'answer', e.target.value)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Ordre d&apos;affichage
                            </label>
                            <input
                              type="number"
                              className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                              value={(item as any).order_index ?? 0}
                              onChange={(e) =>
                                updateFaqField(
                                  item.id,
                                  'order_index' as any,
                                  Number(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSaveFaq(item)}
                              disabled={savingFaqId === item.id}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              {savingFaqId === item.id ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFaq(item.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Création nouvelle FAQ */}
            <form
              onSubmit={handleCreateFaq}
              className="mt-2 border-t border-gray-200 pt-3 space-y-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-600" />
                  Nouvelle question
                </h3>
                <p className="text-[11px] text-gray-500 max-w-xs text-right">
                  Concentre-toi sur ce que les gens demandent le plus souvent par mail ou sur
                  place.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Question
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={newFaq.question || ''}
                    onChange={(e) => updateNewFaq('question', e.target.value)}
                    placeholder="Ex. Puis-je modifier ma catégorie après inscription ?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Catégorie (optionnel)
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={newFaq.category || ''}
                    onChange={(e) => updateNewFaq('category', e.target.value)}
                    placeholder="Inscriptions, Parcours, Remboursement…"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Réponse
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  rows={3}
                  value={newFaq.answer || ''}
                  onChange={(e) => updateNewFaq('answer', e.target.value)}
                  placeholder="Réponse claire, sans jargon, en 2–4 phrases max."
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Ordre d&apos;affichage
                  </label>
                  <input
                    type="number"
                    className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={(newFaq as any).order_index ?? 0}
                    onChange={(e) =>
                      updateNewFaq('order_index' as any, Number(e.target.value) || 0)
                    }
                  />
                </div>
                <Button type="submit" variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter à la FAQ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
