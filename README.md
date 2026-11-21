# Lendas da Ruptura ⚔️ — Android (pré-alfa v0.1)

Protótipo original de arena MOBA para **Android**, criado para teste inicial na Play Store. **Esta versão é 2D, offline, contra bots; ainda NÃO é multiplayer 3D e NÃO tem pagamento real.**

## ⬇️ Baixar e instalar o jogo (Android)

**[Baixar APK de teste v0.1 diretamente](https://github.com/carlosalbertoapolinariofilho-create/Lendas-da-Ruptura/releases/download/v0.1.0-alpha/Lendas-da-Ruptura-v0.1-Teste.apk)**

Ao baixar em um Android, abra o APK e autorize a instalação por essa fonte somente se confiar no aplicativo. Este é um **APK debug de teste**, não um lançamento oficial da Play Store. A versão atual é offline e possui apenas compras simuladas.

[Abrir página de versões do jogo](https://github.com/carlosalbertoapolinariofilho-create/Lendas-da-Ruptura/releases)

## Funcionalidades que já estão no protótipo
- Arena jogável com três rotas, minions, torres, núcleos e vitória/derrota;
- 15 heróis cadastrados com papéis e atributos diferentes;
- Joystick por toque, ataque básico, três habilidades e pontos de experiência;
- Moedas de teste para desbloquear heróis e armas;
- Conquistas e passes semanal/mensal demonstrativos;
- Dados locais persistentes no aparelho (sem conta e sem nuvem).

## Android e Play Console
- Pacote: `br.com.lendasdaruptura` (não alterar após o primeiro upload na Play Console).
- Version code: 1; versão: `0.1.0-alpha`; minSdk 26; targetSdk 36.
- Código: Android Java/WebView com o jogo totalmente contido em `app/src/main/assets/index.html`.
- `Actions` → `Android - APK e AAB assinado` compila **APK debug** em cada push na branch main.
- O **AAB para Play Console** é gerado apenas após configurar os segredos de assinatura no repositório (veja `docs/PLAY-CONSOLE.md`). Nunca comitar ou mandar sua chave privada por chat.
- O APK debug serve para instalação direta, **não** substitui o AAB assinado para a trilha de teste interno da Google Play.

## Limites importantes
O protótipo ainda não conta com personagens 3D, servidor, PvP 5v5, partidas online, matchmaking, efeitos finais, anticheat ou Google Play Billing. A loja de diamantes mostra preços ilustrativos, **sem cobrança**. O sistema de moedas local e os passes são apenas para demonstrar o projeto.

## Segurança, dados e publicação
Sem acesso à internet, sem captura de dados pessoais, sem SDK de anúncios ou analytics nesta versão. Ao integrar servidores, login e compras, será preciso atualizar política de privacidade e declaração de segurança dos dados, implementar validação de pagamentos em servidor e cumprir as políticas do Google Play.

**Créditos:** jogo e personagens originais de Lendas da Ruptura. Sem imagens, personagens ou marcas licenciados de outros MOBAs.

Consulte `docs/PLAY-CONSOLE.md` para os passos seguintes e `docs/ROADMAP.md` para a expansão.
