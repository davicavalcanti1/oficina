# Etapa 0: Censo do pátio e triagem

Data: 22/10/2026
Prazo: funcionando na oficina antes de 15/11/2026
Status: escopo aprovado pelo Davi em 22/10/2026

## Problema que resolve

A oficina tem cerca de 80 carros parados, alguns há meses, alguns há anos.
Não existe registro de entrada nem de saída. Ninguém sabe quanto dinheiro
está travado no pátio nem qual carro vale a pena atacar primeiro.

A etapa 0 não é o sistema de gestão. É a ferramenta para desatolar o
pátio e gerar caixa. O sistema de gestão (etapa 1) começa quando o pátio
estiver sob controle e quando o Davi tiver dedicação integral.

## Quem usa

- Administrador: cadastra os carros e atualiza a situação. Usa pelo celular.
- Dono: olha o painel e a lista de prioridade. Só consome.
- Davi: faz o censo presencialmente com o administrador e ajusta o que
  travar no uso.

Regra de ouro: cadastrar um carro leva no máximo 3 minutos, atualizar
a situação leva 10 segundos. Se passar disso, o administrador abandona
como abandonaram a planilha.

## O que o sistema faz

### 1. Cadastro de carro parado

Campos, todos no celular, em uma tela só:

| Campo | Obrigatório | Observação |
|---|---|---|
| Placa | sim | identifica o carro |
| Modelo | sim | texto livre, ex: "Corolla 2015" |
| Cliente | sim | nome |
| Telefone | sim | abre WhatsApp direto |
| Entrada estimada | sim | ano obrigatório, mês opcional. Ninguém sabe o dia |
| Serviço combinado | sim | texto livre curto |
| O que já foi feito | não | texto livre |
| O que falta | sim | texto livre |
| Dias estimados para concluir | sim | chute do dono em dias, não em horas. Pode mudar |
| Valor já pago pelo cliente | sim | pode ser zero |
| Valor a receber | sim | o que entra se o carro for entregue |
| Peças já compradas (R$) | não | dinheiro da oficina já gasto no carro |
| Situação | sim | ver abaixo |
| Observação | não | qualquer coisa |

### 2. Situação

Uma de quatro, sempre:

- **Travado por nós**: a oficina precisa trabalhar. Falta tempo, falta o
  dono, falta peça.
- **Travado pelo cliente**: esperando o cliente aprovar, pagar ou responder.
- **Abandonado**: cliente sumiu, não responde há muito tempo.
- **Em andamento**: alguém está trabalhando nele agora.

Toda mudança de situação grava data e hora. A partir daí nasce a métrica
de tempo que hoje não existe.

### 3. Lista de prioridade

Ordenada por **pontuação = valor a receber / dias para concluir**.

- Carro quase pronto tem poucos dias, sobe sozinho.
- Carro que paga bem sobe.
- Carro travado pelo cliente aparece em lista separada: o trabalho ali
  não é mecânico, é ligar para o cliente. Botão de WhatsApp ao lado.
- Carro abandonado não entra na prioridade. Fica em lista própria com o
  valor de peças já gasto, para o dono decidir o que fazer.

Empate: cliente que responde ganha. Marcação manual "cliente responde"
sim ou não.

### 4. Painel do dono

Quatro números, grandes, na primeira tela:

1. Carros no pátio
2. Dinheiro a receber parado no pátio (soma do valor a receber)
3. Tempo médio parado (desde a entrada estimada; sem mês, conta a partir de julho do ano)
4. Carros travados por nós versus travados pelo cliente

Abaixo, a lista de prioridade com os cinco primeiros.

### 5. Saída do pátio

Botão "entregue" no carro. Pede data e valor recebido. O carro some da
lista e entra no histórico. Esse é o primeiro registro de saída que a
oficina vai ter na vida.

## O que NÃO entra na etapa 0

- Ordem de serviço com fases detalhadas (etapa 1)
- Agenda do dono (etapa 1)
- Financeiro de entradas e saídas, compras, caixa diário (etapa 2)
- Estoque, venda de peças, borracharia, remap (etapa 3)
- Cadastro de várias oficinas com login próprio (etapa 4)
- Orçamento digital, nota fiscal, qualquer integração

Se algo disso parecer urgente durante o censo, anota e volta para o
planejamento. Não entra no meio.

## Processo do censo

1. Davi e administrador percorrem o pátio com o celular.
2. Carro por carro: foto da placa, preenche a tela, próximo.
3. Dias estimados e valor a receber: perguntar ao dono no mesmo dia,
   pode ser em lote no fim.
4. Meta: 80 carros em duas sessões de 2 horas.
5. No fim, o painel mostra pela primeira vez o tamanho real do problema.

## Decisões técnicas

- Web responsivo, feito para celular. Abre no navegador, sem instalar.
- Supabase para banco e login, mesma linha dos outros projetos do Davi.
- Login simples: um usuário para a oficina. Dono e administrador usam o
  mesmo.
- Desde o primeiro registro, toda tabela tem `oficina_id`. Hoje é sempre
  a mesma oficina. Custa nada agora e evita reescrever na etapa 4.
- Nada depende de computador na oficina. Se o celular quebrar, outro
  celular abre tudo.
- Fundo branco, tema claro, contornos finos. Mesmo padrão visual dos
  outros projetos.

## Modelo de dados inicial

```
oficinas
  id, nome, criado_em

veiculos
  id, oficina_id, placa, modelo, cliente_nome, cliente_telefone,
  cliente_responde (bool), entrada_ano (int), entrada_mes (int, opcional),
  servico_combinado, feito, falta, dias_restantes,
  valor_pago, valor_a_receber, pecas_compradas,
  situacao (nos | cliente | abandonado | andamento | entregue),
  observacao, entregue_em, valor_recebido_entrega,
  criado_em, atualizado_em

situacao_historico
  id, veiculo_id, de, para, em
```

## Critério de sucesso da etapa 0

- Os 80 carros cadastrados antes de 15/11.
- O dono sabe dizer quanto dinheiro está parado no pátio.
- Em 30 dias, a lista de prioridade virou pelo menos alguns carros
  entregues e pagos que estavam parados há meses.
- O administrador continua atualizando sem o Davi cobrar.

Se o último item falhar, a etapa 1 não começa até entender o porquê.

## Decisões fechadas em 22/10

- Nome do produto: fica para depois. Pasta `oficina` é genérica de propósito.
- Estimativa de conclusão em dias, não em horas. Horas é fino demais para o dono chutar.
- Entrada estimada: só o ano é obrigatório, mês quando souber.
- Placa: só o número. Nada de foto na etapa 0.
