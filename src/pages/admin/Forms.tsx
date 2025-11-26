// src/pages/admin/Forms.tsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail,
  User,
  Calendar,
  Phone,
  MapPin,
  Filter,
  Search,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type MessageStatus = 'new' | 'read' | 'archived' | string;
type MembershipStatus = 'new' | 'in_progress' | 'done' | string;

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: MessageStatus;
  created_at: string;
}

interface MembershipRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  membership_type: string;
  message?: string;
  status?: MembershipStatus;
  created_at: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: MessageStatus | MembershipStatus }) {
  const normalized = (status || 'new') as string;

  const styles: Record<string, string> = {
    new: 'bg-orange-100 text-orange-800',
    read: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  };

  const labels: Record<string, string> = {
    new: 'Nouveau',
    read: 'Lu',
    archived: 'Archivé',
    in_progress: 'En cours',
    done: 'Traité',
  };

  const cls =
    styles[normalized] ?? 'bg-gray-100 text-gray-800';
  const label = labels[normalized] ?? normalized;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export function Forms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'messages') as
    | 'messages'
    | 'memberships';

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [memberships, setMemberships] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );

  const [messagesStatusFilter, setMessagesStatusFilter] = useState<
    'all' | 'new' | 'read' | 'archived'
  >('all');
  const [messagesSearch, setMessagesSearch] = useState('');

  const [membershipStatusFilter, setMembershipStatusFilter] = useState<
    'all' | 'new' | 'in_progress' | 'done'
  >('all');

  const newMessagesCount = useMemo(
    () => messages.filter((m) => (m.status || 'new') === 'new').length,
    [messages],
  );
  const newMembershipsCount = useMemo(
    () =>
      memberships.filter((m) => (m.status || 'new') === 'new').length,
    [memberships],
  );

  const selectedMessage = useMemo(
    () =>
      messages.find((m) => m.id === selectedMessageId) || null,
    [messages, selectedMessageId],
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [msgs, membs] = await Promise.all([
        adminApi.getContactMessages(),
        adminApi.getMembershipRequests(),
      ]);
      setMessages(msgs || []);
      setMemberships(membs || []);

      // si aucun message sélectionné, on prend le premier
      if (!selectedMessageId && msgs && msgs.length > 0) {
        setSelectedMessageId(msgs[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateMessageStatus(id: string, status: string) {
    await adminApi.updateContactMessage(id, status);
    await loadData();
  }

  async function handleUpdateMembershipStatus(id: string, status: string) {
    await adminApi.updateMembershipRequest(id, status);
    await loadData();
  }

  const filteredMessages = useMemo(() => {
    let list = [...messages];

    if (messagesStatusFilter !== 'all') {
      list = list.filter(
        (m) => (m.status || 'new') === messagesStatusFilter,
      );
    }

    const term = messagesSearch.trim().toLowerCase();
    if (term) {
      list = list.filter((m) => {
        const haystack = `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase();
        return haystack.includes(term);
      });
    }

    // tri récent -> ancien
    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    );

    return list;
  }, [messages, messagesStatusFilter, messagesSearch]);

  const filteredMemberships = useMemo(() => {
    let list = [...memberships];

    if (membershipStatusFilter !== 'all') {
      list = list.filter(
        (m) => (m.status || 'new') === membershipStatusFilter,
      );
    }

    // tri récent -> ancien
    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    );

    return list;
  }, [memberships, membershipStatusFilter]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Formulaires & messages
            </h1>
            <p className="mt-1 text-sm text-gray-600 max-w-2xl">
              Gère les messages reçus via le site (contact) et les
              demandes d&apos;adhésion au club. Tout au même endroit.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center rounded-full bg-orange-50 border border-orange-100 px-3 py-1 text-orange-800">
              <Mail className="w-3 h-3 mr-1" />
              {newMessagesCount} message(s) à traiter
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-blue-800">
              <User className="w-3 h-3 mr-1" />
              {newMembershipsCount} adhésion(s) en attente
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setSearchParams({ tab: 'messages' })}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'messages'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            Messages de contact
            {newMessagesCount > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {newMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'memberships' })}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'memberships'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            Demandes d&apos;adhésion
            {newMembershipsCount > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {newMembershipsCount}
              </span>
            )}
          </button>
        </div>

        {/* CONTENU TABS */}
        {activeTab === 'messages' && (
          <MessagesTab
            messages={filteredMessages}
            rawMessages={messages}
            statusFilter={messagesStatusFilter}
            onStatusFilterChange={setMessagesStatusFilter}
            search={messagesSearch}
            onSearchChange={setMessagesSearch}
            selectedMessage={selectedMessage}
            onSelectMessage={setSelectedMessageId}
            onUpdateStatus={handleUpdateMessageStatus}
          />
        )}

        {activeTab === 'memberships' && (
          <MembershipsTab
            memberships={filteredMemberships}
            rawMemberships={memberships}
            statusFilter={membershipStatusFilter}
            onStatusFilterChange={setMembershipStatusFilter}
            onUpdateStatus={handleUpdateMembershipStatus}
          />
        )}
      </div>
    </AdminLayout>
  );
}

/* ---- Messages tab ---- */

interface MessagesTabProps {
  messages: ContactMessage[];
  rawMessages: ContactMessage[];
  statusFilter: 'all' | 'new' | 'read' | 'archived';
  onStatusFilterChange: (v: 'all' | 'new' | 'read' | 'archived') => void;
  search: string;
  onSearchChange: (v: string) => void;
  selectedMessage: ContactMessage | null;
  onSelectMessage: (id: string | null) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

function MessagesTab({
  messages,
  rawMessages,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  selectedMessage,
  onSelectMessage,
  onUpdateStatus,
}: MessagesTabProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="font-medium">Messages de contact</span>
            <span className="text-gray-400 text-xs">
              {rawMessages.length} reçu(s)
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex flex-wrap gap-1 text-xs">
              {(
                [
                  ['all', 'Tous'],
                  ['new', 'Nouveaux'],
                  ['read', 'Lus'],
                  ['archived', 'Archivés'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onStatusFilterChange(value)}
                  className={`rounded-full border px-3 py-1 ${
                    statusFilter === value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher (nom, email, sujet)…"
                className="pl-8 pr-3 py-1.5 rounded-md border border-gray-300 text-sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {messages.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-600">
            Aucun message pour ce filtre.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2.2fr,3fr] gap-6">
            {/* LISTE */}
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <ul className="divide-y divide-gray-200 max-h-[520px] overflow-y-auto">
                {messages.map((msg) => {
                  const isActive = selectedMessage?.id === msg.id;
                  return (
                    <li
                      key={msg.id}
                      className={`p-3 sm:p-4 cursor-pointer flex flex-col gap-1 ${
                        isActive
                          ? 'bg-white border-l-4 border-orange-500'
                          : 'bg-gray-50 hover:bg-white'
                      }`}
                      onClick={() => onSelectMessage(msg.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {msg.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {msg.email}
                          </p>
                        </div>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-1">
                        {msg.subject}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <StatusBadge status={msg.status || 'new'} />
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* DÉTAIL */}
            <div className="border rounded-lg bg-white p-4 sm:p-5">
              {!selectedMessage ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Sélectionne un message dans la liste.
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        Reçu le {formatDate(selectedMessage.created_at)}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-gray-900">
                        {selectedMessage.subject}
                      </h2>
                    </div>
                    <StatusBadge
                      status={selectedMessage.status || 'new'}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-800">
                          {selectedMessage.name}
                        </p>
                        {selectedMessage.email && (
                          <p className="text-gray-500">
                            {selectedMessage.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>

                  <div className="flex flex-wrap justify-between gap-2 pt-2">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                        'Réponse: ' + selectedMessage.subject,
                      )}`}
                      className="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                    >
                      Répondre par email
                    </a>

                    {selectedMessage.status === 'new' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onUpdateStatus(selectedMessage.id, 'read');
                          onSelectMessage(selectedMessage.id);
                        }}
                      >
                        Marquer comme lu
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---- Memberships tab ---- */

interface MembershipsTabProps {
  memberships: MembershipRequest[];
  rawMemberships: MembershipRequest[];
  statusFilter: 'all' | 'new' | 'in_progress' | 'done';
  onStatusFilterChange: (v: 'all' | 'new' | 'in_progress' | 'done') => void;
  onUpdateStatus: (id: string, status: string) => void;
}

function MembershipsTab({
  memberships,
  rawMemberships,
  statusFilter,
  onStatusFilterChange,
  onUpdateStatus,
}: MembershipsTabProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="font-medium">Demandes d&apos;adhésion</span>
            <span className="text-gray-400 text-xs">
              {rawMemberships.length} reçue(s)
            </span>
          </div>

          <div className="flex flex-wrap gap-1 text-xs">
            {(
              [
                ['all', 'Toutes'],
                ['new', 'Nouvelles'],
                ['in_progress', 'En cours'],
                ['done', 'Traitées'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onStatusFilterChange(value)}
                className={`rounded-full border px-3 py-1 ${
                  statusFilter === value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {memberships.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-600">
            Aucune demande pour ce filtre.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      Reçue le {formatDate(m.created_at)}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-gray-900">
                      {m.first_name} {m.last_name}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {m.membership_type}
                    </p>
                  </div>
                  <StatusBadge status={m.status || 'new'} />
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <a
                      href={`mailto:${m.email}`}
                      className="hover:underline"
                    >
                      {m.email}
                    </a>
                  </div>
                  {m.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <a href={`tel:${m.phone}`}>{m.phone}</a>
                    </div>
                  )}
                  {(m.address || m.city || m.postal_code) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>
                        {m.address && `${m.address}, `}
                        {m.postal_code && `${m.postal_code} `}
                        {m.city}
                      </span>
                    </div>
                  )}
                  {m.birth_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Naissance : {formatDate(m.birth_date)}</span>
                    </div>
                  )}
                </div>

                {m.message && (
                  <div className="mt-3 rounded-md bg-gray-50 p-2 text-xs text-gray-800 whitespace-pre-wrap">
                    {m.message}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Statut :</span>
                    <select
                      value={m.status || 'new'}
                      onChange={(e) =>
                        onUpdateStatus(m.id, e.target.value)
                      }
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                    >
                      <option value="new">Nouveau</option>
                      <option value="in_progress">En cours</option>
                      <option value="done">Traité</option>
                    </select>
                  </div>

                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(
                      'Votre demande d’adhésion aux Traîne-Savates',
                    )}`}
                    className="inline-flex items-center rounded-lg bg-orange-600 px-3 py-1.5 font-semibold text-white hover:bg-orange-700"
                  >
                    Répondre par email
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
