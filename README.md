# ToDo - List  :)

Para facilitar e ajudar a organização do dia a dia, com notas simples onde você cria notas título e a nota em si, onde divide-se em tarefas concluídas e não concluídas.

# 📁 Como baixar o projeto 

Para baixar o projeto, você precisará ter instalado em sua máquina as seguintes ferramentas: [Git](https://git-scm.com), [Node.js](https://nodejs.org/en/), [PostgreSQL]:(https://www.postgresql.org/) para gerenciar o banco de dados e [Yarn](https://yarnpkg.com/) para gerenciar pacotes. Além disso, é bom ter um editor para trabalhar com o código como [VSCode](https://code.visualstudio.com/).

```
# Clone este repositório
$ git clone

# Acesse a pasta do projeto no terminal
$ cd ToDo

# O projeto ToDo está dividido em duas pastas:
- backend e frontend, portanto é necessário acessar cada pasta para o passo a seguir
$ cd frontend

# Instale as dependências
$ yarn install

# Em seguida acesse a pasta
$ cd backend

# Instale as dependências
$ yarn install
```

# Configuração 

Antes de executar o projeto, você precisará realizar algumas configurações:

Na pasta "backend" configure as variáveis de ambiente:

Renomeie o arquivo .env.example para .env.
Edite o arquivo .env e insira as informações necessárias conforme as variáveis exemplificadas no código.

Será necessário a criação do banco de dados:

```
# Acesse o postgresql no terminal
$ psql -U (seu usuário do postgres)

# Em seguida será solicitada sua senha

# Logado no postgres, crie seu banco de dados
$ CREATE DATABASE ToDo (ou o nome que preferir);
$ pressione CTRL + ENTER

# Com o banco de dados criado acesse a pasta do backend via terminal
$ cd backend

# Execute a aplicação
$ yarn start run:dev

# A aplicação será aberta na porta:3003 - acesse http://localhost:3003

# Abra outro terminal no projeto e acesse a pasta do frontend
$ cd frontend

# Execute a aplicação
$ yarn run dev

# A aplicação será aberta na porta:3003 - acesse http://localhost:8080
```

# Documentação da API


A API consiste em um serviço de gerenciamento de tarefas (to-do list). Abaixo estão listados os endpoints disponíveis juntamente com os payloads esperados em cada requisição.

## Endpoint: /todos
### GET /todos
Retorna todas as tarefas cadastradas.

Exemplo de requisição
```
GET /todos
```

Exemplo de resposta
```

[
  {
    "id": "1",
    "title": "Tarefa 1",
    "noteContent": "Conteúdo da Tarefa 1",
    "completed": false
  },
  {
    "id": "2",
    "title": "Tarefa 2",
    "noteContent": "Conteúdo da Tarefa 2",
    "completed": true
  }
]
```

### POST /todos
Cria uma nova tarefa.

```
POST /todos
Content-Type: application/json
```

```
{
  "title": "Nova Tarefa",
  "noteContent": "Conteúdo da nova tarefa",
  "completed": false
}
```

### Exemplo de resposta
```
{
  "id": "3",
  "title": "Nova Tarefa",
  "noteContent": "Conteúdo da nova tarefa",
  "completed": false
}
```

Endpoint: /todos/{id}

PATCH /todos/{id}
Atualiza uma tarefa existente.

### Exemplo de requisição
```
PATCH /todos/1
Content-Type: application/json
```
```
{
  "title": "Tarefa Atualizada"
}
```
### Exemplo de resposta

```
{
  "id": "1",
  "title": "Tarefa Atualizada",
  "noteContent": "Conteúdo da Tarefa 1",
  "completed": false
}
```

### DELETE /todos/{id}
Remove uma tarefa existente.
```
DELETE /todos/1
```
### Exemplo de resposta
```
Status: 204 No Content
```

## Contato

Se você tiver alguma dúvida ou precisar de assistência, sinta-se à vontade para entrar em contato:

- Nome: Pedro Ribeiro
- Email: pedro.heribeiro6795@gmail.com