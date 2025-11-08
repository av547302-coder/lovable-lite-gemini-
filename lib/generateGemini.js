const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.generateWebsite = async (prompt) => {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: "gemini-pro" });

  const response = await model.generateContent([
    {
      role: 'user',
      content: `Generate complete static website code from this prompt. 
      Return response strictly as JSON only.

      Format example:
      {
        "index.html": "<!doctype html>...",
        "styles.css": "body { ... }",
        "script.js": "console.log('hello')"
      }

      Prompt: ${prompt}`
    }
  ]);

  const text = response.response.text().trim();
  return JSON.parse(text);
};
