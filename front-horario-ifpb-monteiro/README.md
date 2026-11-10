# Horário IFPB · Campus Monteiro

Frontend React + Vite para consulta pública e administração do horário
acadêmico.

## Estrutura principal

```text
src/
├── components/
├── images/
├── pages-horario-ifpb/
│   ├── admin/
│   └── public/
├── routes/AppRoutes.tsx
├── services/
├── style/
├── App.tsx
└── main.tsx
```

## Desenvolvimento

```bash
pnpm install
pnpm dev
pnpm build
```

## Dados atuais

O sistema continua usando a fonte local existente. A camada preparada para a
API não executa requisições enquanto a integração não for ativada.

## Integração futura

Consulte
[`docs/INTEGRACAO_API_SPRING_BOOT.md`](docs/INTEGRACAO_API_SPRING_BOOT.md) para
configuração de ambiente, contratos, endpoints, CORS, JWT, entidade
Administrador e roteiro de migração para Java Spring Boot.
