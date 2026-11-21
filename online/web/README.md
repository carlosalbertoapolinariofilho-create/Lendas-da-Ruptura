# Versão Web do Lendas da Ruptura 3D

Este diretório documenta a publicação **WebGL 2.0 / WebAssembly** (Godot 4.5.2) do cliente 3D experimental.

- Código Godot: `online/game3d`
- Export preset: `Web Navegador` no `online/game3d/export_presets.cfg`
- CI: `.github/workflows/godot-web.yml`, publica somente os arquivos estáticos compilados na branch dedicada `web-dist`
- Servidor WSS de partidas 1x1: `wss://lendas-multiplayer-alpha-production.up.railway.app/ws`
- Serviço Railway web separado do servidor de partidas, via Nginx (sem executar Node no navegador)
- Exportação Web é *single threaded* para permitir funcionamento por HTTPS sem COOP/COEP. Requer navegador com WebGL2 + WebAssembly.

Limitações: visual 3D provisório, 1x1 de pré-alfa, sem 5x5 competitivo nem pagamentos. Melhor desempenho no APK nativo. Usar em modo paisagem no celular. Verificar a interface touch em aparelhos reais antes de divulgar publicamente.

Em caso de problema de sessão de teste, use nome diferente no segundo navegador e não compartilhe tokens locais.
