<script>
  let todos = [];
  let title = '';
  let noteContent = '';
  let editingTodo = null;

  async function handleSubmit() {
    const data = {
      title,
      noteContent,
      completed: false
    };

    try {
      const response = await fetch('http://localhost:3003/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar tarefa');
      }

      const createdTodo = await response.json();
      console.log('Tarefa criada:', createdTodo);
      todos = [...todos, createdTodo];
      resetForm();
    } catch (error) {
      console.error('Erro:', error.message);
      // Trate o erro de acordo com a sua necessidade
    }
  }

  const resetForm = () => {
    title = '';
    noteContent = '';
  };

  const fetchTodos = async () => {
    try {
      const response = await fetch('http://localhost:3003/todos');
      if (!response.ok) {
        throw new Error('Erro ao buscar as tarefas');
      }
      todos = await response.json();
    } catch (error) {
      console.error('Erro:', error.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`http://localhost:3003/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir tarefa');
      }

      todos = todos.filter(todo => todo.id !== id);
      console.log('Tarefa excluída:', id);
    } catch (error) {
      console.error('Erro:', error.message);
      // Trate o erro de acordo com a sua necessidade
    }
  };

  const updateNote = async (id, newTitle, newNoteContent) => {
    try {
      const data = {
        title: newTitle,
        noteContent: newNoteContent,
      };

      const response = await fetch(`http://localhost:3003/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar tarefa');
      }

      const updatedTodo = await response.json();
      console.log('Tarefa atualizada:', updatedTodo);
      todos = todos.map(todo => {
        if (todo.id === updatedTodo.id) {
          return updatedTodo;
        }
        return todo;
      });
      cancelEditing();
    } catch (error) {
      console.error('Erro:', error.message);
      // Trate o erro de acordo com a sua necessidade
    }
  };

  const toggleCompletion = async (id, completed) => {
    try {
      const data = { completed };

      const response = await fetch(`http://localhost:3003/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar o status da tarefa');
      }

      const updatedTodo = await response.json();
      console.log('Tarefa atualizada:', updatedTodo);
      todos = todos.map(todo => {
        if (todo.id === updatedTodo.id) {
          return updatedTodo;
        }
        return todo;
      });
    } catch (error) {
      console.error('Erro:', error.message);
    }
  };

  const startEditing = (id) => {
    editingTodo = todos.find(todo => todo.id === id);
  };

  const cancelEditing = () => {
    editingTodo = null;
  };

  fetchTodos();
</script>

<style>
  .completed {
    text-decoration: line-through;
    color: gray;
  }
</style>

<main>
  <h1>Lista de Tarefas</h1>

  <!-- Formulário para criação de tarefas -->
  <form on:submit|preventDefault={handleSubmit}>
    <label>
      Título:
      <input type="text" bind:value={title} />
    </label>
    <label>
      Conteúdo da Tarefa:
      <textarea bind:value={noteContent}></textarea>
    </label>
    <button type="submit">Criar Tarefa</button>
  </form>

  <ul>
    {#each todos as todo}
      <li>
        {#if editingTodo && editingTodo.id === todo.id}
          <form on:submit|preventDefault={() => updateNote(todo.id, editingTodo.title, editingTodo.noteContent)}>
            <label>
              Título:
              <textarea bind:value={editingTodo.title}></textarea>
            </label>
            <label>
              Conteúdo da Tarefa:
              <textarea bind:value={editingTodo.noteContent}></textarea>
            </label>
            <button type="submit">Atualizar</button>
            <button type="button" on:click={cancelEditing}>Cancelar</button>
          </form>
        {:else}
          <div>
            <input type="checkbox" checked={todo.completed} on:change={() => toggleCompletion(todo.id, !todo.completed)} />
            <label for="completed">Concluído</label>
          </div>
          <h3 class:completed={todo.completed}>{todo.title}</h3>
          <p class:completed={todo.completed}>{todo.noteContent}</p>
          <button on:click={() => startEditing(todo.id)}>Editar</button>
          <button on:click={() => deleteTodo(todo.id)}>Excluir</button>
        {/if}
      </li>
    {/each}
  </ul>
</main>
