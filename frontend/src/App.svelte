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
          return { ...todo, completed: updatedTodo.completed };
        }
        return todo;
      })
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
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .todo_form {
    width: 35%;
    padding: 15px;
    border-radius: 4px;
    border: 1px solid #5f6368;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  .btn {
    border: none;
    border-radius: 4px;
	  background-color: #333;
	  color: beige;
    transition: 1s;
  }

  .container-btn {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
  }


  .btn:hover {
	  background-color: rgb(41, 37, 37);
  }

  input {
    width: 100%;
	  background-color: rgb(41, 37, 37);
    border: none;
    border-radius: 4px;
	  color: beige;
  }

  .container-notes {
    width: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  ul {
    width: 100%;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  li {
    display: flex;
    flex-direction: column;
    border: 1px solid #5f6368;
    padding: 15px;
    border-radius: 4px;
    transition: 0.8s;
  }

  li:hover {
    box-shadow: 0 0 5px #888888;
  }

  .edit {
    margin: auto;
  }

  .checkBoxk {
    border-radius: 4px;
    padding: 5px;
    display: flex;
    gap: 5px;
    margin: auto;
    transition: 1s;
  }

  .checkBoxk:hover {
	  background-color: rgb(41, 37, 37);
  }

  .box {
    margin: auto 0;
    cursor: pointer;
  }

  .completed {
    text-decoration: line-through;
    color: gray;
  }
  
</style>

<main>
  <h1>Lista de Tarefas <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-clipboard-check" width="40" height="40" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
    <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path>
    <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
    <path d="M9 14l2 2l4 -4"></path>
 </svg> </h1>
  <section class="todo_form">
    <form on:submit|preventDefault={handleSubmit}>
      <div>
        <input type="text" placeholder="Título" bind:value={title} />
      </div>
      <div>
        <input bind:value={noteContent} placeholder="Crie uma nota.." />
      </div>
      <div class="container-btn">
        <button class="btn" id="save" type="submit">Salvar</button>
      </div>
    </form>
  </section>

  <section class="container-notes">
    <h2>Tarefas Pendentes <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-check" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M5 12l5 5l10 -10"></path>
   </svg></h2>
    <ul>
      {#each todos.filter(todo => !todo.completed) as todo}
        <li>
          {#if editingTodo && editingTodo.id === todo.id}
            <form on:submit|preventDefault={() => updateNote(todo.id, editingTodo.title, editingTodo.noteContent)}>
              <label>
                <input bind:value={editingTodo.title} />
              </label>
              <label>
                <input bind:value={editingTodo.noteContent} />
              </label>
              <div class="container-btn">
                <div class="checkBoxk">
                  <input class="box" type="checkbox" checked={editingTodo.completed} on:change={() => toggleCompletion(todo.id, !editingTodo.completed)} />
                  <label for="completed">Concluir</label>
                </div>
                <button class="btn edit" type="submit">Atualizar</button>
                <button class="btn edit" type="button" on:click={cancelEditing}>Cancelar</button>
              </div>
            </form>
          {:else}
            <h3 class:completed={todo.completed}>{todo.title}</h3>
            <p class:completed={todo.completed}>{todo.noteContent}</p>
            <div class="container-btn">
              <button class="btn" on:click={() => startEditing(todo.id)}>Editar</button>
              <button class="btn" on:click={() => deleteTodo(todo.id)}>Excluir</button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </section>

  <section class="container-notes">
    <h2>Tarefas Concluídas <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-checks" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M7 12l5 5l10 -10"></path>
      <path d="M2 12l5 5m5 -5l5 -5"></path>
   </svg></h2>
    <ul>
      {#each todos.filter(todo => todo.completed) as todo}
        <li>
          <div class="checkBoxk completed">
            <input class="box" type="checkbox" checked={todo.completed} on:change={() => toggleCompletion(todo.id, !todo.completed)} />
            <label for="completed">Concluído</label>
          </div>
          <h3 class:completed={todo.completed}>{todo.title}</h3>
          <p class:completed={todo.completed}>{todo.noteContent}</p>
          <div class="container-btn">
            <button class="btn" on:click={() => deleteTodo(todo.id)}>Excluir</button>
          </div>
        </li>
      {/each}
    </ul>
  </section>
</main>
