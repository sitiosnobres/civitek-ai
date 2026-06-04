require("dotenv").config();
const fs = require("fs");

const config = JSON.parse(
  fs.readFileSync("./config.json", "utf8")
);

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =========================
// PESQUISAR SITE
// =========================

async function pesquisarSite(pergunta) {

    try {

        const perguntaNormalizada = pergunta
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        let resultados = "";

    

        // GOOGLE CUSTOM SEARCH
        const urlGoogle =
            `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(pergunta)}&num=5&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}`;

        const responseGoogle = await fetch(urlGoogle);

        const dataGoogle = await responseGoogle.json();

        console.log("RESULTADOS GOOGLE:");
        console.log(JSON.stringify(dataGoogle, null, 2));

        // RESULTADOS GOOGLE
        if (dataGoogle.items && dataGoogle.items.length > 0) {

            dataGoogle.items.slice(0, 3).forEach((item, index) => {

                resultados += `
Resultado ${index + 1}:

Título:
${item.title}

Link:
${item.link}

Resumo:
${item.snippet}

`;

            });

        }

        // PÁGINAS IMPORTANTES
        const paginas = [
            "https://www.civitek.sitiosnobres.pt/",
          
        ];

        let encontrou = false;

        for (const pagina of paginas) {

            try {

                const respostaSite = await fetch(pagina);

                const html = await respostaSite.text();

                const htmlNormalizado = html
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

                // PESQUISA HTML
                if (htmlNormalizado.includes(perguntaNormalizada)) {

                    resultados += `
Foi encontrada informação relacionada com "${pergunta}" na página:
${pagina}

`;

                    encontrou = true;
                }

                // EXTRAIR LINKS
                const regexLinks = /href="([^"]+)"/g;

                let match;

                while ((match = regexLinks.exec(html)) !== null) {

                    const link = match[1];

                    if (!link.startsWith("http")) {
                        continue;
                    }

                    const linkNormalizado = link
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");

                    const slugLink = linkNormalizado
                        .replace("https://www.civitek.sitiosnobres.pt/", "")
                        .replace(/\//g, " ")
                        .replace(/-/g, " ")
                        .trim();

                    // LINK PRINCIPAL
                    if (slugLink.includes(perguntaNormalizada)) {

                        resultados =
`LINK PRINCIPAL ENCONTRADO:
${link}

` + resultados;

                        encontrou = true;
                    }

                    // LINK RELACIONADO
                    else if (linkNormalizado.includes(perguntaNormalizada)) {

                        resultados +=
`Link relacionado encontrado:
${link}

`;

                        encontrou = true;
                    }

                }

            } catch (e) {

                console.log("Erro ao verificar página:", pagina);

            }

        }

        // SEM RESULTADOS
        if (!encontrou && !resultados.trim()) {

            return `Não foram encontrados resultados oficiais sobre "${pergunta}".`;

        }

        return resultados;

    } catch (erro) {

        console.error("ERRO AO PESQUISAR SITE:");
        console.error(erro);

        return "Erro ao pesquisar o site.";

    }

}

// =========================
// CHAT
// =========================

app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        console.log("Mensagem recebida:", message);

        // =========================
        // PALAVRAS-CHAVE INTELIGENTES
        // =========================

        const pergunta = message.toLowerCase();
      const perguntaLimpa = pergunta
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?.,!]/g, "")
    .trim();
      const modulos = {
        modulosplataforma: `
A CIVITEK disponibiliza vários módulos de transformação digital para freguesias e entidades públicas.

• Gestão de Documentos
• Gestão de Cemitérios
• Formulários Digitais
• Gestão de Ocorrências
• Biblioteca Digital
• Relatórios e Indicadores
• Aplicação Mobile
• Bots de IA e Integrações
• Turismo Inteligente
• QR Codes Georreferenciados

Todos os módulos podem funcionar de forma integrada numa única plataforma.
`,
        funcionalidades: `
A plataforma CIVITEK foi desenvolvida para simplificar a gestão administrativa e melhorar a comunicação com os cidadãos.

Principais funcionalidades:

• Digitalização de processos
• Registo e acompanhamento de ocorrências
• Gestão documental
• Formulários online
• Relatórios automáticos
• Notificações aos utilizadores
• Georreferenciação de ocorrências
• Integração com aplicações móveis
• Assistentes de Inteligência Artificial

A solução adapta-se às necessidades de cada entidade.
`,
        demonstracoes: `
Para solicitar uma demonstração personalizada da plataforma CIVITEK, envie um email para:

<a href="mailto:sitiosnobres@gmail.com">
📧 sitiosnobres@gmail.com
</a>

Teremos todo o gosto em apresentar as funcionalidades e módulos mais adequados às necessidades da sua entidade.
`,
        integracoes: `
A plataforma CIVITEK foi desenvolvida para integrar facilmente com diferentes serviços e tecnologias.

Principais integrações:

• Bots de Inteligência Artificial
• Aplicações Mobile
• Websites institucionais
• Formulários digitais
• QR Codes georreferenciados
• Sistemas de gestão documental
• Serviços externos e APIs

A nossa equipa técnica especializada analisa cada projeto e desenvolve soluções de integração adaptadas às necessidades de cada entidade.

Para mais informações ou um estudo personalizado, contacte:

<a href="mailto:sitiosnobres@gmail.com">
📧 sitiosnobres@gmail.com
</a>
`,
        apoio_comercial: `
A equipa CIVITEK está disponível para prestar apoio comercial e esclarecer todas as questões relacionadas com a plataforma.

Podemos ajudar na análise das necessidades da sua entidade, apresentação de módulos, demonstrações personalizadas, integração de soluções digitais e definição da melhor estratégia de implementação.

Trabalhamos com freguesias, municípios e outras entidades que pretendam modernizar os seus serviços e melhorar a comunicação com os cidadãos.

Para obter informações comerciais ou solicitar uma proposta personalizada, contacte:

<a href="mailto:sitiosnobres@gmail.com">
📧 sitiosnobres@gmail.com
</a>
`,
    documentos: `
Módulo Gestão de Documentos

• Arquivo digital de documentos
• Pesquisa rápida e avançada
• Gestão de categorias
• Controlo de acessos
• Organização documental
`,

    cemiterios: `
Módulo Gestão de Cemitérios

• Registo de sepulturas
• Gestão de concessões
• Registo de falecidos
• Pesquisa de localização
• Relatórios e mapas
`,

    ocorrencias: `
Módulo Gestão de Ocorrências

• Registo de ocorrências
• Acompanhamento de estados
• Georreferenciação
• Notificações
• Relatórios
`,

    biblioteca: `
Módulo Biblioteca Digital

• Publicação de documentos
• Pesquisa online
• Arquivo histórico
• Download de conteúdos
`,

    formularios: `
Módulo Formulários Digitais

• Formulários online
• Recolha automática de dados
• Fluxos de aprovação
• Integração com serviços
`,

    mobile: `
Aplicação Mobile CIVITEK

• Acesso móvel aos serviços
• Participação cidadã
• Consulta de informação
• Notificações em tempo real
`
};
const chave = perguntaLimpa
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

if (
    chave.includes("o que e a civitek") ||
    chave === "civitek"
) {

    return res.json({
        reply: `
A CIVITEK é uma plataforma de transformação digital para freguesias, municípios e entidades públicas.

Principais módulos:

• Gestão de Documentos
• Gestão de Cemitérios
• Formulários Digitais
• Ocorrências
• Biblioteca Digital
• Relatórios & Indicadores
• Aplicação Mobile
• Bots de IA & Integrações
• Turismo Inteligente

Mais informações:
https://civitek.sitiosnobres.pt
`
    });

}
if (
    pergunta.includes("funcionalidades")
) {

    return res.json({
        reply: modulos.funcionalidades
    });

}
      if (
    pergunta.includes("demonstração") ||
    pergunta.includes("demonstracao") ||
    pergunta.includes("demonstrações") ||
    pergunta.includes("demonstracoes")
) {

    return res.json({
        reply: `
Para solicitar uma demonstração personalizada da plataforma CIVITEK, clique no endereço abaixo:

<a href="mailto:sitiosnobres@gmail.com">📧 sitiosnobres@gmail.com</a>

Teremos todo o gosto em agendar uma apresentação da plataforma.
`
    });

}
if (modulos[chave]) {

    return res.json({
        reply: modulos[chave]
    });

}
      if (
    pergunta.includes("módulos da plataforma") ||
    pergunta.includes("modulos da plataforma")
) {

    return res.json({
        reply: modulos.modulosplataforma
    });

}
      if (
    pergunta.includes("integrações") ||
    pergunta.includes("integracoes") ||
    pergunta.includes("integração") ||
    pergunta.includes("integracao")
) {

    return res.json({
        reply: modulos.integracoes
    });

}
      if (
    pergunta.includes("apoio comercial") ||
    pergunta.includes("comercial") ||
    pergunta.includes("proposta") ||
    pergunta.includes("orçamento") ||
    pergunta.includes("orcamento")
) {

    return res.json({
        reply: modulos.apoio_comercial
    });

}

if (
    pergunta.includes("modulos") ||
    pergunta.includes("módulos")
) {

    return res.json({
        reply: `
A plataforma CIVITEK inclui:

• Gestão de Documentos
• Gestão de Cemitérios
• Formulários Digitais
• Ocorrências
• Biblioteca Digital
• Relatórios & Indicadores
• Aplicação Mobile
• Bots de IA & Integrações
• Turismo Inteligente
• QR Codes Georreferenciados

Mais informações:
https://civitek.sitiosnobres.pt
`
    });

}

        // PESQUISAR SITE
        const resultadosSite = await pesquisarSite(message);

        console.log("RESULTADOS FINAIS:");
        console.log(resultadosSite);

        // OPENAI
        const response = await client.chat.completions.create({

            model: "gpt-3.5-turbo",

            messages: [

                {
                    role: "system",
                    content: `
És o assistente virtual oficial da CIVITEK.

Responde apenas com informação oficial da CIVITEK.

O site oficial é:
https://civitek.sitiosnobres.pt

Nunca inventes domínios, URLs, funcionalidades ou módulos.

Nunca menciones civitek.pt.

Se o utilizador perguntar "o que é a CIVITEK", responde:

"A CIVITEK é uma plataforma de transformação digital para freguesias, municípios e entidades públicas.

Principais módulos:
• Gestão de Documentos
• Gestão de Cemitérios
• Formulários Digitais
• Ocorrências
• Biblioteca Digital
• Relatórios & Indicadores
• Aplicação Mobile
• Bots de IA & Integrações

Website oficial:
https://sitiosnobres.pt/#contacto

Se o utilizador perguntar por um módulo da CIVITEK,
explica as funcionalidades do módulo.

Não respondas como um motor de pesquisa.
Não digas "na página oficial encontra-se".
Fala sempre da funcionalidade da plataforma.

Se existirem links principais encontrados, dá prioridade máxima a esses links.

Nunca digas que não encontraste informação se existirem resultados.

Responde de forma curta, natural e objetiva.

Evita respostas demasiado longas.

Fala como um assistente virtual moderno e simpático.

Quando existir um link principal relevante, mostra-o logo no início da resposta.

Evita listar demasiados links desnecessários.

Resume a informação mais importante em poucas frases.

Se existirem links relevantes, menciona-os claramente.

Se realmente não existirem resultados, então informa claramente que não foi encontrada informação oficial disponível.

Resultados encontrados no site:

${resultadosSite}
`
                },

                {
                    role: "user",
                    content: message
                }

            ]

        });

        const reply = response.choices[0].message.content;

        res.json({
            reply: reply
        });

    } catch (error) {

        console.log("ERRO NO SERVIDOR:");
        console.log(error);

        res.status(500).json({
            reply: "Erro no servidor."
        });

    }

});

// =========================
// SERVIDOR
// =========================

app.listen(3000, () => {

    console.log("Servidor IA ativo na porta 3000");

});
