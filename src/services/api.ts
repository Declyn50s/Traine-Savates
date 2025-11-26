import { supabase } from '../lib/supabase';
import type {
  HomeData,
  Edition,
  EditionFullData,
  RaceCategory,
  ProgramItem,
  ClubData,
  PracticalInfo,
  FaqItem,
  Sponsor,
  ContactFormData,
  MembershipFormData,
  ClubContent,
  TrainingSession,
  CommitteeMember,
} from '../types/api';

export const api = {
  async getHomeData(): Promise<HomeData> {
    const { data: edition, error: editionError } = await supabase
      .from('editions')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (editionError) throw editionError;
    if (!edition) throw new Error('No active edition found');

    const { data: races, error: racesError } = await supabase
      .from('race_categories')
      .select('*')
      .eq('edition_id', edition.id)
      .order('order_index');

    if (racesError) throw racesError;

    const { data: clubContent, error: clubError } = await supabase
      .from('club_content')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (clubError) throw clubError;

    const { data: sponsors, error: sponsorsError } = await supabase
      .from('sponsors')
      .select('*')
      .eq('category', 'principal')
      .order('order_index')
      .limit(6);

    if (sponsorsError) throw sponsorsError;

    const { data: practicalInfo, error: infoError } = await supabase
      .from('practical_info')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (infoError) throw infoError;

    return {
      edition: edition as Edition,
      featured_races: (races || []).slice(0, 6) as RaceCategory[],
      club_excerpt: clubContent as ClubContent,
      main_sponsors: (sponsors || []) as Sponsor[],
      practical_info_excerpt: practicalInfo as PracticalInfo,
    };
  },

  async getActiveEdition(): Promise<Edition> {
    const { data, error } = await supabase
      .from('editions')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('No active edition found');

    return data as Edition;
  },

  async getEdition(slug: string): Promise<Edition> {
    const { data, error } = await supabase
      .from('editions')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Edition not found');

    return data as Edition;
  },

  async getEditionFull(slug: string): Promise<EditionFullData> {
    const edition = await this.getEdition(slug);
    const races = await this.getRaces(slug);
    const program = await this.getProgram(slug);

    return { edition, races, program };
  },

  async getRaces(slug: string): Promise<RaceCategory[]> {
    const edition = await this.getEdition(slug);

    const { data, error } = await supabase
      .from('race_categories')
      .select('*')
      .eq('edition_id', edition.id)
      .order('order_index');

    if (error) throw error;
    return (data || []) as RaceCategory[];
  },

  async getProgram(slug: string): Promise<ProgramItem[]> {
    const edition = await this.getEdition(slug);

    const { data, error } = await supabase
      .from('program_items')
      .select('*')
      .eq('edition_id', edition.id)
      .order('order_index');

    if (error) throw error;
    return (data || []) as ProgramItem[];
  },

  async getClubData(): Promise<ClubData> {
    const { data: content, error: contentError } = await supabase
      .from('club_content')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (contentError) throw contentError;

    const { data: trainingSessions, error: trainingError } = await supabase
      .from('training_sessions')
      .select('*')
      .order('order_index');

    if (trainingError) throw trainingError;

    const { data: committeeMembers, error: committeeError } = await supabase
      .from('committee_members')
      .select('*')
      .order('order_index');

    if (committeeError) throw committeeError;

    return {
      content: content as ClubContent,
      training_sessions: (trainingSessions || []) as TrainingSession[],
      committee_members: (committeeMembers || []) as CommitteeMember[],
    };
  },

  async getPracticalInfo(): Promise<PracticalInfo> {
    const { data, error } = await supabase
      .from('practical_info')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as PracticalInfo;
  },

  async getFaq(): Promise<FaqItem[]> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return (data || []) as FaqItem[];
  },

  async getSponsors(): Promise<Sponsor[]> {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return (data || []) as Sponsor[];
  },

  async submitContact(formData: ContactFormData): Promise<void> {
    const { error } = await supabase.from('contact_messages').insert({
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
    });

    if (error) throw error;
  },

  async submitMembership(formData: MembershipFormData): Promise<void> {
    const { error } = await supabase.from('membership_requests').insert({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      birth_date: formData.birth_date,
      address: formData.address,
      city: formData.city,
      postal_code: formData.postal_code,
      membership_type: formData.membership_type,
      message: formData.message,
    });

    if (error) throw error;
  },
};
