export async function runGemini(data: any) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta API KEY");

  const prompt = `
    La persona invierte USD ${data.investment} por mes durante ${data.years} años
    con una rentabilidad del ${data.rate}%. Explica el resultado en tono simple,
    motivador y enfocado en planificación financiera.
  `;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta IA.";
}
