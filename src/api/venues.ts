import { api } from './client';
import type { HallLayout, Section, Venue } from './types';

export async function fetchVenues() {
  const { data } = await api.get<Venue[]>('/venues');
  return data;
}

export async function fetchSections(venueId: string) {
  const { data } = await api.get<Section[]>(`/venues/${venueId}/sections`);
  return data;
}

export async function saveSectionLayout(venueId: string, sectionId: string, layout: HallLayout) {
  const { data } = await api.put<Section>(`/venues/${venueId}/sections/${sectionId}`, { layout });
  return data;
}
