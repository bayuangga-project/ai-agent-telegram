/**
 * ===================================================================
 * LLM PROVIDER: GEMINI
 * Sekarang menerima modelName sebagai parameter, supaya bisa dipakai
 * untuk tier model manapun (pro-preview, flash, flash-lite) tanpa
 * duplikasi kode.
 * ===================================================================
 */
const GeminiProvider = {
  NAME: 'gemini',

  call(systemInstruction, messages, temperature, modelName) {
    const config = Config.load();
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
      modelName + ':generateContent?key=' + config.geminiApiKey;

    const contents = messages.map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const payload = {
      contents: contents,
      generationConfig: { temperature: temperature || 0.7 }
    };
    if (systemInstruction) {
      payload.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    if (code === 429 || code === 503) {
      throw new Error('Gemini (' + modelName + ') overload (HTTP ' + code + ')');
    }
    if (code !== 200) {
      throw new Error('Gemini (' + modelName + ') HTTP error ' + code +
        ' | ' + response.getContentText().substring(0, 200));
    }

    const data = JSON.parse(response.getContentText());
    const candidate = data.candidates && data.candidates[0];
    if (!candidate || !candidate.content) {
      throw new Error('Gemini (' + modelName + ') tidak mengembalikan kandidat jawaban');
    }

    return candidate.content.parts[0].text;
  }
};