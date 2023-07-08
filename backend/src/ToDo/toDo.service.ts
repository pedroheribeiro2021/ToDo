/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Todo } from './toDo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async findAll(): Promise<Todo[]> {
    return this.todoRepository.find()
  }

  async create(title: string, noteContent: string): Promise<Todo> {
    const todo = new Todo()
    todo.title = title
    todo.noteContent = noteContent
    await this.todoRepository.save(todo)
    return todo
  }
}
