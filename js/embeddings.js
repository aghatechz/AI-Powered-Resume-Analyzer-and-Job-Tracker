import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const websiteContent = JSON.parse(fs.readFileSync("website_content.json"));
const vectors = [];

async function createEmbeddings() {
  for (const section of websiteContent.training_data) {
    const textToEmbed = `
Page: ${section.page}
Section: ${section.section}
Description: ${section.description}
Examples: ${section.example_prompts.map(p => p.user_input + " → " + p.expected_output).join("\n")}
    `;

    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textToEmbed
      });

      vectors.push({
        id: `${section.page}-${section.section}`,
        vector: embedding.data[0].embedding,
        metadata: section
      });

    } catch(err) {
      console.error(`Failed for ${section.page}-${section.section}:`, err);
    }
  }

  fs.writeFileSync("vectors.json", JSON.stringify(vectors, null, 2));
  console.log("Embeddings created and saved:", vectors.length);
}

createEmbeddings();
