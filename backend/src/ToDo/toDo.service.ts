/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Todo } from './toDo.entity';
import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async findAll(): Promise<Todo[]> {
    return this.todoRepository.find()
  }

  async create(title: string, noteContent: string, completed: boolean): Promise<Todo> {
    if (title !== '' || noteContent !== '') {
      const todo = new Todo()
      todo.title = title
      todo.noteContent = noteContent
      todo.completed = completed
      await this.todoRepository.save(todo)
      return todo
    } else {
      throw new Error('O título e o conteúdo da nota devem ser fornecidos.')
    }
  }
  

  async update(id: string, title: string, noteContent: string, completed: boolean): Promise<Todo> {
    const options: FindOneOptions<Todo> = { where: { id } }
    const todo = await this.todoRepository.findOne(options)
    if (!todo) {
      throw new NotFoundException('Tarefa não encontrada')
    }
    todo.title = title
    todo.noteContent = noteContent
    todo.completed = completed
    await this.todoRepository.save(todo)
    return todo
  }

  async remove(id: string): Promise<void> {
    const result = await this.todoRepository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('Tarefa não encontrada')
    }
  }
}
