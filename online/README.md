# Lendas da Ruptura — núcleo multiplayer 3D (pré-alfa v0.2)

Esta pasta é um projeto **novo**, separado do APK 2D v0.1, para evoluir o jogo rumo a um MOBA original no Android. Não copie arte, personagens, nomes, marcas ou mapas de jogos comerciais existentes.

## 🎮 Baixar a versão 3D de teste para Android

**[Baixar APK 3D v0.2 diretamente no celular](https://github.com/carlosalbertoapolinariofilho-create/Lendas-da-Ruptura/releases/download/v0.2.0-3d-alpha/Lendas-da-Ruptura-3D-alpha.apk)**

[Consultar a página da versão 3D](https://github.com/carlosalbertoapolinariofilho-create/Lendas-da-Ruptura/releases/tag/v0.2.0-3d-alpha)

O APK foi **gerado com sucesso no GitHub Actions**, mas ainda precisa ser testado em aparelho físico. É um **APK DEBUG** de pré-alfa, para treino **offline** e testes de interface. O servidor 1x1/ranqueada experimental está desenvolvido, porém **não está hospedado na internet**; portanto este APK não oferece PvP online público neste momento. Ele não é um AAB assinado para envio à Play Console.

## O que já existe aqui

- **Godot 4.5+** com arena 3D procedural e câmera isométrica, três rotas, torres e bases, movimentação WASD e toque, heróis estilizados temporários e botões de combate.
- **Treino offline** com alvos controlados localmente, ataques, habilidade de investida e cura.
- **Servidor Node.js** com WebSocket, posições/ataques validados no servidor, dois times, vida/respawn, ondas de minions, torres, núcleo, vitória/derrota e partidas 1x1 de teste.
- **Fila casual e fila ranqueada experimental 1x1**, com MMR de teste persistido em JSON e sessões por token. NÃO é sistema ranqueado de produção.
- **6 heróis com atributos distintos** no novo núcleo (o protótipo 2D anterior possui 15 cadastros não migrados).
- Testes automatizados do servidor (`node --test`).

## Iniciar o servidor (computador/VPS)

Requer Node.js 22+ e rede com porta TCP 8080. Na pasta `servidor`:

```bash
npm install
npm test
npm start
```

Acesse `http://localhost:8080/health` e use WebSocket `ws://127.0.0.1:8080/ws` no cliente Godot do mesmo computador. Para jogadores pela internet, hospede um servidor com **HTTPS + WSS**, domínio e backup seguro de dados. NÃO use Vercel Functions como servidor contínuo de partidas.

Alternativamente, na pasta `servidor`: `docker build -t lendas-server . && docker run --rm -p 8080:8080 -v "$PWD/data:/srv/data" lendas-server` (no Windows, ajuste o volume).

## Rodar o cliente 3D

Instale o Godot 4.5 ou superior e abra a pasta `game3d` no editor. Execute a cena principal. `Treino Offline` funciona sem servidor. Para teste 1x1, abra duas instâncias do cliente, escolha nomes e heróis diferentes, conecte ambas ao endereço do servidor e entre na mesma fila.

**Android**: será necessário configurar a exportação Android do Godot, permissões de INTERNET e HTTPS/WSS, assinatura, APK/AAB e testes em aparelhos reais. **Nenhum AAB do cliente Godot 3D está pronto ainda**.

## Limites desta versão

- Visual 3D **provisório**, geometria básica. Falta modelagem/animação de produção.
- Servidor não está hospedado automaticamente; projeto contém o código e Dockerfile.
- Matchmaking limitado a 1x1; falta 5x5, múltiplos mapas, seleção com bans/picks, balanceamento e ranking robusto.
- MMR é experimental; antes de lançar ranqueadas reais, precisa antifraude, auditoria de partidas, autenticação reforçada, moderação, reconexão e dados em banco gerenciado.
- Loja, diamantes, passes e pagamentos **não estão ativos**. Não gerar cobranças sem Google Play Billing e verificação de compras em backend.

## Próximas etapas

1. Rodar e validar jogo 3D no Android (FPS, memória, bateria e interface touch).
2. Hospedar servidor de testes com domínio WSS, monitoramento, backup e região próxima dos jogadores.
3. Criar heróis originais com modelos e animações 3D, câmera, habilidades e áudio refinados.
4. Migrar 1x1 para casual e ranqueada 5x5, com matchmaking por MMR, reconexão, anticheat e rankings por temporada.
5. Criar sistema de conta segura, inventário, skins, moedas e progresso em banco gerenciado.
6. Integrar Google Play Billing, registrar diamantes e passes na Play Console, validar compras no backend, definir política de privacidade e cumprir políticas de publicação.
7. Exportar AAB assinado de teste e enviar à Play Console. O APK 2D v0.1 é um aplicativo **diferente em termos de tecnologia**; reutilizar o mesmo package ID requer cuidado com assinatura e versionCode.
