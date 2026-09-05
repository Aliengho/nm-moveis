# NM Móveis — site

Site institucional da NM Móveis (Nataniel Móvel), marcenaria em Maputo.
Reorganizado em várias páginas, no espírito de sites profissionais de produto —
uma home com visão geral e cada assunto na sua própria página.

## Estrutura

```
index.html      → Início (hero + painéis de navegação para as outras páginas)
sobre.html       → Sobre a marcenaria, como trabalhamos, porque escolher-nos
servicos.html     → Serviços (roupeiros, cozinhas, painéis, personalizados...)
projetos.html     → Portfólio com filtro por categoria e lightbox
contacto.html     → Canais de contacto (WhatsApp, email, atelier)

style.css        → design partilhado por todas as páginas
script.js        → menu mobile, header, animações, filtro da galeria, lightbox
assets/img/      → todas as fotografias e o logótipo
```

Nenhuma framework é usada — HTML, CSS e JavaScript puros. Abra qualquer
página com a extensão **Live Server** do VS Code, ou clique duas vezes em
`index.html` para abrir no navegador.

## O que ainda pode precisar de ajuste

- **Número de WhatsApp:** `https://wa.me/258873429456` — aparece no cabeçalho,
  rodapé e nas secções de contacto de todas as páginas. Se não for o número
  certo, procure por `258873429456` em todos os ficheiros `.html` e substitua.
- **Email de contacto:** `geral@nmmoveis.co.mz`, no rodapé e em `contacto.html`.
- **Fotografias:** estão todas em `assets/img/`, com nomes descritivos
  (`roupeiro-branco.jpg`, `cozinha-ilha.jpg`, etc.). Para trocar uma imagem,
  substitua o ficheiro mantendo o mesmo nome, ou atualize o `src`/`data-full`
  correspondente no HTML.
- **Categorias da galeria** (`projetos.html`): cada item tem um
  `data-category` (`roupeiros`, `cozinhas`, `paineis`, `personalizados`) usado
  pelos botões de filtro — ajuste conforme adicionar novos projetos.
