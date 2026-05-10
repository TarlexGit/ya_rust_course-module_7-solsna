# Solana Mini Launchpad

Учебный мини-лаунчпад на Solana + Anchor: два on-chain контракта (SOL/USD oracle и token minter), Rust backend для обновления цены и прослушки событий, а также Remix фронтенд (папка `frontend/`).

## Что в проекте

- `program/` — Anchor workspace с двумя программами:
  - `programs/sol_usd_oracle` — хранит цену SOL/USD (`u64`, fixed-6).
  - `programs/token_minter` — минтит токены и списывает комиссию в SOL по цене из oracle.
  - `tests/` — LiteSVM тесты (`*.litesvm.ts`).
- `backend/` — Rust сервис, который:
  - обновляет oracle (`update_price`);
  - слушает и декодирует события `TokenCreated`.
- `frontend/` — UI для подключения кошелька, выбора сети и минта токена.

## Текущий статус

- `program` LiteSVM тесты: рабочие.
- `backend` unit-тесты: рабочие.
- Localnet E2E: рабочий (`validator -> deploy -> init -> backend -> mint from UI`).
- Devnet E2E: рабочий.

## Быстрый запуск (localnet)

### 1) Установка зависимостей

```bash
make install
```

### 2) Поднять валидатор (отдельный терминал)

```bash
make validator
```

Если нужен рендер метаданных в кошельке, вместо этого:

```bash
make validator-metaplex
```

### 3) Сборка и деплой программ (второй терминал)

```bash
solana config set --url localhost
solana airdrop 10
make build
make deploy
make init
```

После `make init` сохранить `ORACLE_STATE_PUBKEY` из вывода.

### 4) Настроить backend

Скопировать шаблон и заполнить:

```bash
cp backend/.env.example backend/.env
```

Минимально важные поля в `backend/.env`:

- `SOLANA_RPC_HTTP=http://127.0.0.1:8899`
- `SOLANA_RPC_WS=ws://127.0.0.1:8900`
- `ORACLE_PROGRAM_ID=<your_oracle_program_id>`
- `MINTER_PROGRAM_ID=<your_minter_program_id>`
- `ORACLE_STATE_PUBKEY=<from_make_init>`
- `BACKEND_KEYPAIR_PATH=~/.config/solana/id.json`

### 5) Запустить backend (третий терминал)

```bash
RUST_LOG=info make backend
```

Ожидаемые признаки:

- периодические логи `oracle price updated`;
- после минта — лог события `TokenCreated`.

### 6) Запустить frontend (четвертый терминал)

```bash
make frontend
```

Дальше в UI:

- подключить кошелек;
- выбрать `Localnet`;
- выполнить `Mint Token`.

### 7) Проверить тесты

```bash
make test
```

Также отдельно:

```bash
cd backend && cargo test
```

## Devnet deployment

Развёртывание и проверка в Devnet выполнены.

| Component | Address |
| --- | --- |
| Oracle Program ID | `7SjPCZFdcXPe2Z79eCJX2VtCrKLoqdhHYcYxaNxEjM9f` |
| Minter Program ID | `7twiuwVZXbPuHtLJWXvHDZuiAuH9zyVwKmkMDV3gC56K` |
| Oracle state PDA | `9F7vt2Re4ijXCNrHu6MiDLkDsj8hbRbYKszTtcUofzso` |

Backend на Devnet обновляет цену в oracle, а mint через frontend порождает событие `TokenCreated`, которое сервис успешно декодирует из логов.

## Successful Devnet

- [Mint #0](https://explorer.solana.com/tx/4BgYW8LCbN4riQkdtp17stmxu1EsxVVpRfgm27rDwRKAvNhveX1SvZA5SCghCe3mPwP8uNo3QAHGVTsYfU1SqcFg?cluster=devnet) - mint `HdRrsspkikc7fe7RxC9uyNcrYUi7EW7qM8dEJggm8eNt`
- [Mint #1](https://explorer.solana.com/tx/6JQKbHbXiezPUQQ9DLHDnYBnDUgf1FpSoJ7fFfeeoAp3L98gNwGnSvrMfmjpM378MpVCwPMYEhPTmBBBeZm8hFZ?cluster=devnet) - mint `J4CsW8VdPSBnBJb8ticoFxa9RUbpeWJZ7WrdKcUK9khR`
- [Mint #2](https://explorer.solana.com/tx/2mUWosPcUx1jgRjxFmmgUGVXJ77EcwmuTtKjJLLPJu5ZQS6w6pf757CedegRD2MyZTcsHJhXwuGQF1yoKeKHT6yM?cluster=devnet) - mint `HNptSxn7YQA9otVnJPGPmJMnJHDBnBA1potxRKSM2hTN`
- [Mint #3](https://explorer.solana.com/tx/qCP4hb51VxZPRdGVZmouEoGuRwgM99AczWwFKngZiWxnAuGrPPeVDYjHzsFsKWFKiQuMjHH3a8dcbiQKymwwhcp?cluster=devnet) - mint `6tfT6mnY9rPpawSXP8JPSaYuefQuNMeiTwczFQn4MqL6`

## Проверка и воспроизведение

Стандартный набор команд для локальной проверки:

```bash
make test
cd backend && cargo test
make deploy
make init
RUST_LOG=info make backend
```

Ожидаемый результат:

- LiteSVM тесты проходят без падений;
- backend unit-тесты проходят;
- после запуска backend в логах есть периодические `oracle price updated`;
- после минта из UI в логах backend появляется `TokenCreated`.

Перед публикацией проверяется, что приватные ключи не попали в git:

```bash
git status
```

## Ограничения и инварианты

- Комиссия считается только через безопасную арифметику (`checked_*`).
- Цена и комиссия хранятся в fixed-point (`decimals = 6`).
- `update_price` доступен только авторизованному admin.
- При stale oracle mint должен падать с ошибкой (`OracleStale`), без молчаливого retry.
