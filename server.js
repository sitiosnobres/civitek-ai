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

      if (
    pergunta.includes("o que é a civitek") ||
    pergunta.includes("civitek") ||
    pergunta.includes("sobre a civitek")
) {

    return res.json({
        reply: `
A CIVITEK é uma plataforma de transformação digital para autarquias, freguesias e entidades públicas.

A solução integra módulos de Gestão Documental, Ocorrências, Formulários Digitais, Gestão de Cemitérios, Biblioteca Digital, Relatórios & Indicadores, Aplicação Mobile, Turismo Inteligente e Assistentes de IA.

Mais informações:
https://civitek.sitiosnobres.pt/
`
    });

}

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
     if (
    pergunta.includes("o que e a civitek") ||
    pergunta.includes("o que é a civitek") ||
    pergunta === "civitek"
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

Mais informações:
https://civitek.sitiosnobres.pt
`
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
És o assistente virtual oficial da civitek.

Responde sempre em português de Portugal.

Usa SEMPRE os resultados encontrados no site oficial.

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
