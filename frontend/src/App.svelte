<script>
	let todos = [];
	let title = '';
  let noteContent = '';
  let editing = false

	async function handleSubmit() {
    const data = {
      title,
      noteContent
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
    } catch (error) {
      console.error('Erro:', error.message);
      // Trate o erro de acordo com a sua necessidade
    }
  }
  
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
        noteContent: newNoteContent
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
    } catch (error) {
      console.error('Erro:', error.message);
      // Trate o erro de acordo com a sua necessidade
    }
  };

  const startEditing = () => editing = true
  const cancelEditing = () => editing = false


	fetchTodos();

  </script>
  
  <h1>Lista de Tarefas</h1>
  
  <!-- Formulário para criação de tarefas -->
  <form on:submit|preventDefault={handleSubmit}>
	<label>
	  Título:
	  <!-- <input type="text" name="title" required> -->
	  <input type="text" bind:value={title} />
	</label>
	<label>
	  Conteúdo da Tarefa:
	  <textarea bind:value={noteContent}></textarea>
	  <!-- <textarea name="noteContent" required></textarea> -->
	</label>
	<button type="submit">Criar Tarefa</button>
  </form>

  <ul>
    {#each todos as todo}
      <li>
        {#if editing}
          <form>
            <label>
              Título:
              <!-- <input type="text" bind:value={title} /> -->
              <textarea bind:value={todo.title}></textarea>
            </label>
            <label>
              Conteúdo da Tarefa:
              <!-- <textarea bind:value={noteContent}></textarea> -->
              <textarea bind:value={todo.noteContent}></textarea>
            </label>
            <!-- <button type="submit">Enviar</button> -->
            <button on:click={() => updateNote(todo.id, todo.title, todo.noteContent)}>Atualizar</button>
            <button type="button" on:click={cancelEditing}>Cancelar</button>
          </form>
        {:else}
          <h3>{todo.title}</h3>
          <p>{todo.noteContent}</p>
          <button on:click={() => startEditing(todo.id)}>Editar</button>
          <button on:click={() => deleteTodo(todo.id)}>Excluir</button>
        {/if}
      </li>
    {/each}
  </ul>