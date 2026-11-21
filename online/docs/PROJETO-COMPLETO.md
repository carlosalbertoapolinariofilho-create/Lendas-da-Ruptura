# Lendas da Ruptura — visão de produção (MOBA original)

Documento de produto, NÃO declaração de que tudo abaixo já esteja implementado.

## Proposta

MOBA 3D mobile gratuito para Android, com batalhas em tempo real, três rotas, heróis originais e evolução competitiva. O estilo deve ser fantasia original com estética anime cinematográfica; não reproduzir visual, mapa, nomes, marcas ou elementos protegidos de Mobile Legends ou League of Legends.

## Partidas e modos

1. Treinamento offline com bots, tutorial, controles acessíveis e configuração de desempenho.
2. Casual 5x5 com matchmaking regional e sistema de reconexão.
3. Ranqueada 5x5 com temporadas, seleção de heróis, escolhas/banimentos no nível alto, MMR, recompensas cosméticas e histórico.
4. Partidas personalizadas para grupos e eventos de comunidade.
5. Futuramente eventos PvE e modos de tempo limitado.

Mapa: três rotas, floresta central, duas bases, torres, tropas, objetivos de equipe e um núcleo a destruir. Tempo-alvo por partida: 12–20 min, a ser validado em teste de jogadores. Vitória por destruição do núcleo rival. Ouro e experiência obtidos durante a partida permitem melhorar habilidades e comprar equipamentos temporários, que são resetados ao fim da partida.

## Heróis e criação de personagem

Seis classes principais: tanque, lutador, assassino, mago, atirador e suporte. Primeira meta artística: 12 heróis originais completos para alfa, crescendo até 20+ conforme testes e capacidade de produção.

O jogador escolhe um herói e personaliza nome, aparência permitida, visual cosmético, arma visual, animação de entrada, ícone e emotes. Uma futura ferramenta de criação de avatar personalizável pode existir fora do modo ranqueado; habilidades e estatísticas competitivas devem seguir classes e kits previamente balanceados para não virar jogo de vantagem paga.

Cada herói: modelo 3D otimizado, esqueleto, animações (repouso, corrida, ataque, habilidades, dano, morte, retorno), voz original, efeitos e som; ataque básico; 3 habilidades principais; habilidade definitiva; atributos/cooldowns de acordo com papel. Testes de acessibilidade para efeitos visuais, contraste, leitura da interface e desempenho.

## Multiplayer de produção

- Partidas dedicadas com simulação **autoritativa do servidor** (cliente envia comandos, não resultados de dano, moedas ou vitória).
- Matchmaking por região, grupo, tempo de espera e faixa de MMR; preferência por baixa latência.
- Meta técnica a validar: simulação 20–30 Hz inicialmente, snapshots comprimidos 10–20 Hz, interpolação no cliente, cliente Android a 30/60 FPS adaptativo.
- Sala de espera, escolha de herói, confirmação de disponibilidade, substituições em casual, reconexão, detecção de ausência, rendição e pós-partida.
- Segurança: autenticação com tokens renováveis, limite de mensagens, verificação de integridade de comandos, análise de partidas e antifraude, logs de auditoria, administração de banimentos.
- Persistência em banco de dados com backup, criptografia de transporte WSS, políticas de privacidade e exclusão de conta.

## Ranqueadas

Ranqueado deve acontecer **somente quando o sistema de partidas e anticheat estiver testado**. Faixas propostas: Bronze, Prata, Ouro, Platina, Diamante, Mestre e Lenda. MMR não pode ser controlado pelo cliente. Modos solo/duo/grupo e recompensas por temporada; proteções contra abandono, manipulação de MMR e contas falsas. A ranqueada 1x1 do protótipo atual é apenas teste técnico com MMR básico; não corresponde a isso.

## Loja e monetização

Uma moeda premium (diamantes) e uma moeda gratuita de progresso. Itens premium sugeridos: skins, efeitos, emotes, animações, personalizações e passes; **nunca vender poder competitivo exclusivo para ranqueadas**. Heróis devem ser acessíveis por progressão gratuita, com compras opcionais justas.

Produtos digitais comprados dentro do jogo distribuído pelo Google Play devem usar o **Google Play Billing** aplicável: IDs de produtos no Play Console, fluxo nativo de compra, validação no servidor com API do Google, idempotência, concessão após compra legítima, cancelamentos e reembolsos. Não confiar apenas em retorno do celular nem guardar credenciais em GitHub público.

Passe semanal e passe mensal precisam definir conteúdo, duração, elegibilidade, renovação ou não renovação, preço transparente e valor contínuo quando forem assinaturas. A escolha entre compra avulsa e assinatura depende das políticas da Google Play. Valores finais somente depois de configuração e aprovação do produto na Play Console.

## Cadastro, moderação e comunidade

Perfis vinculados a identidade única e segura; contas, apelidos, inventário, níveis, domínio dos heróis, partidas, estatísticas, emblemas e conquistas persistidos no backend. Opções de amizade, formar equipe, silenciar, denunciar, bloquear e moderação. Cuidado com público infantil e políticas de dados e compras.

## Etapas de entrega e critérios de qualidade

**Marco A (em andamento):** treino visual 3D, servidor 1x1, habilidades iniciais, testes de conexão, fila e sincronização.

**Marco B:** cliente Godot Android instalável + servidor de staging hospedado + dois aparelhos jogando pela internet com latência medida.

**Marco C:** 5x5 técnico com reconexão, bots, objetivos completos, infraestrutura para várias salas e persistência em banco.

**Marco D:** 12 heróis com arte 3D original, interface e áudio refinados, desempenho e balanceamento em dispositivos Android comuns.

**Marco E:** temporadas, ranqueada auditável, antiabuso, contas, progressão, itens e Google Play Billing em sandbox e produção.

**Marco F:** teste interno/fechado na Play Console, classificação etária, política de privacidade pública, segurança de dados, acessibilidade e publicação por etapas.

## Limitações atuais (novembro/2026)

- Godot 3D com geometria procedimental básica, sem assets de produção;
- Servidor Node.js não hospedado, sem conexão pública WSS;
- Teste 1x1 e ranking experimental; não há modo 5x5 pronto;
- Loja de diamantes e passes ainda não possuem transações reais;
- Sem APK/AAB do novo cliente 3D; APK/AAB v0.1 anterior é offline 2D.
