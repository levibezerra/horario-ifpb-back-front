# Integração futura com API Spring Boot

Este documento define a preparação do frontend do sistema de horários do IFPB
Campus Monteiro para uma futura API REST. A API ainda não existe e **nenhuma
chamada HTTP é executada automaticamente** pelo sistema atual.

## Estado atual e fronteira de dados

- As telas continuam usando os dados locais de
  `src/services/adminService.ts` e `src/services/scheduleService.ts`.
- `src/hooks/useAdminData.tsx` é a fronteira usada pelos componentes para
  consultar e alterar dados acadêmicos.
- `src/services/api.ts`, os arquivos `*Service.ts` e
  `src/services/api-support/` contêm a infraestrutura e os contratos futuros.
- Não existe fallback silencioso: enquanto a migração não for ativada, o
  sistema não tenta acessar endpoints.

## URL da API

Copie `.env.example` para `.env.local`:

```env
VITE_API_URL=http://localhost:8080/api
```

A URL é lida exclusivamente por `src/services/api.ts`. Componentes não
devem conter URLs absolutas ou importar Axios.

## Estrutura

```text
src/services/
├── api.ts                    # instância Axios e interceptadores
├── cursoService.ts
├── turmaService.ts
├── disciplinaService.ts
├── professorService.ts
├── ambienteService.ts
├── horarioService.ts
├── administradorService.ts
└── api-support/
    ├── endpoints.ts
    ├── apiError.ts
    ├── authSession.ts
    ├── autenticacaoService.ts
    └── crudService.ts
```

Contratos estão em `src/types/api.ts`. O hook `useApiRequest` prepara os estados
`idle`, `loading`, `success` e `error`.

## Axios, erros e JWT

`client.ts` configura JSON, timeout, base URL, `Authorization: Bearer` e
tratamento central para:

- 400: dados inválidos;
- 401: sessão expirada ou token inválido;
- 403: ação sem permissão;
- 404: registro não encontrado;
- 500: falha interna;
- indisponibilidade de rede.

`setApiAuthHandlers` permitirá conectar 401/403 ao contexto e ao roteador sem
acoplar Axios aos componentes.

O token não é salvo em `localStorage`. A estratégia recomendada é access token
curto em memória e refresh token em cookie `HttpOnly`, `Secure` e `SameSite`.

Contratos esperados de autenticação:

| Método | Endpoint | Uso |
| --- | --- | --- |
| POST | `/auth/login` | Validar credenciais e obter access token |
| POST | `/auth/refresh` | Renovar sessão usando cookie HttpOnly |
| POST | `/auth/logout` | Revogar/encerrar a sessão |

Resposta de login/refresh:

```json
{
  "accessToken": "token-jwt",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "administrador": {
    "id": 60,
    "nome": "Nome do administrador",
    "email": "admin@ifpb.edu.br",
    "perfil": "ADMIN",
    "ativo": true
  }
}
```

Formato de erro recomendado:

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Existem campos inválidos.",
  "errors": { "email": "Este e-mail já está cadastrado." },
  "timestamp": "2026-10-21T14:00:00Z",
  "path": "/api/administradores"
}
```

## Entidades e relacionamentos

Todos os relacionamentos usam IDs (`number` ou `string`), nunca somente nomes.

- `CursoApi`: `id`, `nome`, `modalidade`, `ativo`.
- `TurmaApi`: `id`, `nome`, `periodo`, `semestre`, `cursoId`, `ativo`.
- `DisciplinaApi`: `id`, `nome`, `sigla`, `cargaHoraria`, `cursoIds`, `ativo`.
- `ProfessorApi`: `id`, `nome`, `email`, `lattes`, `cursoIds`, `ativo`.
- `AmbienteApi`: `id`, `nome`, `tipo`, `localizacao`, `capacidade`, `ativo`.
- `HorarioApi`: IDs de turma, disciplina, professor e ambiente; dia, início e
  fim, `status` (`RASCUNHO` ou `PUBLICADO`) e `publishedAt`.
- `AdministradorApi`: `id`, `nome`, `email`, `perfil`, `ativo`.

No modelo local temporário, `AdminSchedule.roomId` representa o mesmo vínculo
que `HorarioApi.ambienteId`. A página pública Por Ambiente filtra
exclusivamente por esse identificador. O campo textual `room` existe apenas
para apresentação e compatibilidade com registros locais antigos.

### Publicação de horários

Contrato esperado:

| Método | Endpoint | Uso |
| --- | --- | --- |
| POST | `/horarios/publicar` | Publicar todos os rascunhos ou os IDs enviados |

Payload opcional para publicação parcial:

```json
{
  "horarioIds": [50, 51, 52]
}
```

Regras que o backend deverá garantir:

- novos horários começam como `RASCUNHO`;
- editar um registro publicado cria uma nova versão em rascunho;
- a versão publicada anterior continua disponível até nova publicação;
- a publicação é transacional e autorizada somente para administradores;
- endpoints públicos retornam exclusivamente versões `PUBLICADO`;
- `publishedAt` é definido pelo servidor;
- exclusão remove o horário da projeção pública;
- consultas públicas e PDFs nunca recebem rascunhos.

Exemplo de horário:

```json
{
  "id": 50,
  "turmaId": 10,
  "disciplinaId": 20,
  "professorId": 30,
  "ambienteId": 40,
  "diaSemana": "SEGUNDA",
  "horaInicio": "07:00",
  "horaFim": "07:50",
  "turma": { "id": 10, "nome": "1º Período ADS" },
  "disciplina": { "id": 20, "nome": "Algoritmos" },
  "professor": { "id": 30, "nome": "Nome do professor" },
  "ambiente": { "id": 40, "nome": "Laboratório 04" }
}
```

## Administrador

Resposta segura:

```json
{
  "id": 60,
  "nome": "Nome do administrador",
  "email": "admin@ifpb.edu.br",
  "perfil": "ADMIN",
  "ativo": true
}
```

Respostas nunca devem incluir senha, hash, salt, refresh token ou credenciais.
Senha aparece somente em requests via HTTPS.

`PATCH /administradores/me` aceita apenas:

```json
{
  "nome": "Novo nome",
  "email": "novo@ifpb.edu.br",
  "novaSenha": "opcional"
}
```

O DTO do próprio perfil não possui `perfil`, impedindo autoelevação pela
interface. O backend deve aplicar a mesma restrição independentemente do
payload recebido.

## Endpoints esperados

Estes caminhos são contratos de documentação; não são considerados disponíveis.

### Recursos acadêmicos

Para `/cursos`, `/turmas`, `/disciplinas`, `/professores`, `/ambientes` e
`/horarios`:

| Método | Endpoint | Uso |
| --- | --- | --- |
| GET | `/{recurso}` | Listar, buscar e paginar |
| GET | `/{recurso}/{id}` | Consultar por ID |
| POST | `/{recurso}` | Criar |
| PUT | `/{recurso}/{id}` | Atualizar |
| PATCH | `/{recurso}/{id}` | Atualizar parcialmente |
| DELETE | `/{recurso}/{id}` | Excluir |

Parâmetros previstos: `page`, `size`, `sort`, `busca` e `ativo`. A resposta
pode ser uma lista ou uma página no formato Spring Data.

### Administradores

| Método | Endpoint | Autorização esperada |
| --- | --- | --- |
| GET | `/administradores/me` | Conta autenticada |
| PATCH | `/administradores/me` | Conta autenticada |
| GET | `/administradores` | Gestão de contas |
| GET | `/administradores/{id}` | Gestão de contas |
| POST | `/administradores` | Criação autorizada |
| PUT | `/administradores/{id}` | Gestão de contas |
| PATCH | `/administradores/{id}` | Ativar/desativar |
| DELETE | `/administradores/{id}` | Exclusão autorizada |

Criação:

```json
{
  "nome": "Nome",
  "email": "admin@ifpb.edu.br",
  "senha": "transmitida-somente-via-https"
}
```

O backend deve garantir e-mail único, hash de senha, status da conta,
permissões e auditoria.

## Migração da fonte local

Quando o backend estiver disponível:

1. validar e ajustar os DTOs em `src/types/api.ts`;
2. configurar `VITE_API_URL`;
3. implementar login real e registrar o token em `authSession`;
4. conectar `setApiAuthHandlers` ao contexto de autenticação;
5. criar um provider assíncrono que consuma os serviços REST;
6. substituir a implementação interna de `useAdminData`, preservando sua API
   pública sempre que possível;
7. mapear DTOs com IDs para os modelos de apresentação;
8. recarregar listas após operações CRUD;
9. remover a persistência local somente depois dos testes;
10. testar respostas vazias, sessão expirada, conflitos e permissões.

Os componentes continuarão consumindo hooks/providers, sem requisições diretas.

## CORS no Spring Boot

Exemplo conceitual para desenvolvimento:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
      .allowedOrigins("http://localhost:5173")
      .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
      .allowedHeaders("Authorization", "Content-Type")
      .allowCredentials(true);
  }
}
```

Em produção, use somente o domínio oficial. Com Spring Security, habilite CORS
também na `SecurityFilterChain`.

## Regras de autorização

- Consulta pública: endpoints de leitura explicitamente públicos.
- CRUD administrativo: autenticação e autorização no backend.
- O frontend pode ocultar ações conforme permissões, mas isso não é segurança.
- Toda autorização real pertence ao Spring Security.
- Senhas devem usar BCrypt ou Argon2.
- Administradores não podem elevar o próprio perfil.
- Alterações de status e permissões devem ser auditáveis.
