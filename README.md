Controle App - Sistema de Gestão Empresarial Integrado
O Controle App é uma aplicação web moderna de página única (Single-Page Application - SPA) desenvolvida para a gestão completa e integrada de um negócio. O sistema foi construído com foco em performance, usabilidade e manutenibilidade, permitindo o controlo de todas as operações essenciais, desde vendas e compras até à gestão financeira, de pessoal e de capital.

Funcionalidades Principais
Dashboard Inteligente: Oferece uma visão geral e em tempo real da saúde do negócio, com cartões de resumo (Vendas do Mês, Saldo em Caixa, Valor do Stock), um gráfico de evolução de vendas e uma lista de atividades recentes.

Gestão de Vendas e Compras: Permite o registo detalhado de vendas e compras, com múltiplos itens por transação e um sistema de gestão de pagamentos parciais.

Controlo Financeiro Completo:

Contas a Receber e a Pagar: Módulos centralizados para gerir dívidas de clientes e pagamentos a fornecedores.

Despesas Gerais: Registo de todas as saídas de caixa que não são compras de produtos (ex: salários, aluguer).

Controlo de Comissões: Cálculo automático e gestão de pagamentos de comissões para vendedores.

Gestão de Pessoas & Empresas: Um sistema unificado para gerir Clientes, Fornecedores, Funcionários e Sócios, evitando a duplicação de dados e permitindo que uma mesma entidade tenha múltiplos papéis.

Gestão de Produtos e Stock: Catálogo de produtos com controlo de preços de compra/venda, categorias e tipos. O stock é atualizado automaticamente a cada venda ou compra, com a possibilidade de ajustes manuais.

Gestão de Capital: Módulo dedicado para registar Aportes (entradas) e Retiradas (saídas) de capital dos sócios.

Autenticação e Controlo de Acesso por Papel (RLS): Sistema de login seguro com diferentes níveis de acesso (ex: Administrador, Gestor, Vendedor), garantindo que cada utilizador veja apenas os dados que lhe são permitidos.

Tecnologias Utilizadas
Frontend: React com Vite, proporcionando um ambiente de desenvolvimento rápido e uma experiência de utilização reativa e fluida.

Backend & Base de Dados: Supabase, que serve como um Backend-as-a-Service (BaaS) sobre uma base de dados PostgreSQL, utilizada para armazenar os dados, gerir a autenticação de utilizadores e fornecer APIs em tempo real.

Estilização: CSS Modules com um sistema de tema centralizado (theme.css), garantindo consistência visual e manutenibilidade do design.

Notificações: react-hot-toast para um feedback moderno e não-intrusivo ao utilizador.

Ícones: react-icons para uma interface visualmente rica e intuitiva.

Arquitetura e Lógica de Negócio
Base de Dados
A base de dados foi desenhada para ser relacional e normalizada, aproveitando o poder do PostgreSQL. Os destaques incluem:

Uma tabela entities unificada para pessoas e empresas, com uma tabela de ligação entity_roles para máxima flexibilidade.

Estruturas "mestre-detalhe" para Vendas e Compras (sales/sale_items).

Tabelas dedicadas para cada tipo de pagamento (sale_payments, purchase_payments, etc.), permitindo o controlo de pagamentos parciais.

Uma tabela product_stock para o inventário, gerida por automações.

Lógica de Backend (Funções e Políticas)
Para garantir a integridade dos dados e a performance, grande parte da lógica de negócio é executada diretamente no backend com o Supabase:

Funções RPC (Remote Procedure Call): Funções inteligentes como create_sale_with_items, pay_client_debt e get_full_dashboard_data executam operações complexas numa única chamada, garantindo a atomicidade (ou tudo funciona, ou nada é alterado) e otimizando a performance.

Triggers (Gatilhos): Automações que, por exemplo, atualizam o stock de um produto automaticamente após uma venda ou compra ser registada.

Row Level Security (RLS): Um sistema de políticas de segurança robusto que filtra os dados diretamente na base de dados, garantindo que um vendedor só possa ver as suas próprias vendas, enquanto um gestor tem uma visão mais ampla.