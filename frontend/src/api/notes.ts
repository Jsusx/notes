import { api } from './client';
import type { Note } from '../types';

export async function getNotes() {
  const { data } = await api.get<Note[]>('/notes');
  return data;
}

export async function createNote(title: string, content: string) {
  const { data } = await api.post<Note>('/notes', { title, content });
  return data;
}

export async function updateNote(
  id: string,
  payload: Partial<Pick<Note, 'title' | 'content' | 'isArchived'>>,
) {
  const { data } = await api.patch<Note>(`/notes/${id}`, payload);
  return data;
}

export async function deleteNote(id: string) {
  await api.delete(`/notes/${id}`);
}
