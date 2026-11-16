# Checklist da publicação de teste

1. Acesse Actions do repositório e aguarde o job Android passar.
2. Abra a execução e baixe o artefato **Lendas-da-Ruptura-APK-teste** (APK de depuração para instalar no aparelho).
3. Para uma versão na **trilha de teste interno** da Play Console, crie e guarde uma **chave de upload JKS** estável, exclusivamente sob seu controle. Não envie a chave e senhas pelo chat e não grave no repositório.
4. Em Settings > Secrets and variables > Actions, configure:
   - ANDROID_KEYSTORE_BASE64 (conteúdo da JKS em base64);
   - ANDROID_KEYSTORE_PASSWORD;
   - ANDROID_KEY_ALIAS;
   - ANDROID_KEY_PASSWORD.
5. Execute novamente o workflow. Com a chave configurada ele gerará o artefato **Lendas-da-Ruptura-AAB-Play-Console**. Mantenha a mesma chave para todas as futuras atualizações.
6. Crie o jogo Lendas da Ruptura no Play Console, pacote `br.com.lendasdaruptura`; configure a assinatura pelo Google Play App Signing e envie o AAB em Teste interno.
7. Complete a ficha da loja, política de privacidade pública, classificação etária, segurança de dados, acesso, anúncios e público-alvo de forma verdadeira.
8. Teste a instalação, o funcionamento, desempenho e compatibilidade em um Android físico.

**Não é publicação automática:** subir um AAB exige acesso à sua Play Console e conclusão do cadastro. A aprovação e requisitos da conta dependem do Google. Este pré-alfa NÃO permite pagamentos reais.

Conta pessoal nova pode estar sujeita a teste fechado com 12 pessoas por 14 dias antes do acesso à produção. Confira o aviso exibido em sua Play Console.

**Atenção:** não usar assinatura efêmera ou nova chave a cada build. O primeiro AAB de produção/teste define o histórico de assinatura de upload.
