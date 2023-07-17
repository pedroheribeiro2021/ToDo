/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from './todo.entity';

@Controller('todos')
export class TodoController {
  constructor(private todoService: TodoService) {}

  @Get()
  async findAll(): Promise<Todo[]> {
    return this.todoService.findAll();
  }

  @Post()
  async create(
    @Body('title') title: string,
    @Body('noteContent') noteContent: string,
    @Body('completed') completed: boolean,
  ): Promise<Todo> {
    return this.todoService.create(title, noteContent, completed);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<Todo>): Promise<Todo> {
    const { title, noteContent, completed } = updateData;
    return this.todoService.update(id, title, noteContent, completed);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.todoService.remove(id);
  }
}
