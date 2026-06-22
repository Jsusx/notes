import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
  ) {}

  findAll(userId: string) {
    return this.notesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const note = await this.notesRepository.findOne({ where: { id, userId } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  create(userId: string, dto: CreateNoteDto) {
    const note = this.notesRepository.create({
      userId,
      title: dto.title ?? 'Sin título',
      content: dto.content ?? '',
    });
    return this.notesRepository.save(note);
  }

  async update(id: string, userId: string, dto: UpdateNoteDto) {
    const note = await this.findOne(id, userId);
    Object.assign(note, dto);
    return this.notesRepository.save(note);
  }

  async remove(id: string, userId: string) {
    const note = await this.findOne(id, userId);
    await this.notesRepository.remove(note);
    return { deleted: true };
  }
}
