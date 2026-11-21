# Arquitetura proposta

## Cliente
- Godot 4.5+, renderizador compatível com Android, câmera isométrica 3D.
- Não confia no próprio cálculo de dano/XP/moedas do jogador.
- Dados recebidos por WebSocket JSON: `welcome`, `auth`, `queued`, `match_found`, `snapshot`, `match_result`.
- Envia `register` ou `login` (token gerado pelo servidor), `select_hero`, `queue`, `input` e `attack`.

## Servidor de partidas
- Node.js 22 + `ws`. Loop 20Hz e snapshots 10Hz.
- Fila casual e MMR experimental separados. Pares 1x1, não 5x5 ainda.
- Limites de velocidade e alcance, habilidades verificadas no servidor, estrutura de combate, vitória pelo núcleo.
- Perfis guardados em JSON no volume `DATA_DIR`, token armazenado apenas como SHA-256. São dados de teste, sem escala e sem controles completos de produção.

## Para produção
- Uma frota de processos dedicados por partida, coordenador de lobby, banco SQL, Redis, filas e monitoramento.
- Autenticação séria + renovação de token + moderação e banimentos + rate limit/IP e detecção de bots.
- Criptografia WSS (TLS) obrigatória na internet.
- Validação server-side de compras Google Play, itens, moeda e antireembolso.
- Replays, métricas de latência, matching regional, reconexão, temporadas e antifraude.
