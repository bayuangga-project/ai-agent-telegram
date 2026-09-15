/**
 * ===================================================================
 * SERVICE: LLM PROVIDER (OPENROUTER)
 * Tanggung jawab: komunikasi langsung dengan OpenRouter API.
 * Kompatibel dengan format OpenAI standard.
 * ===================================================================
 */
const OpenRouterProvider = {
  API_URL: 'https://openrouter.ai/api/v1/chat/completions',

  /**
   * Panggil API OpenRouter.
   * @param {string} [systemInstruction] - Persona / instruksi sistem
   * @param {Array<{role: string, text: string}>} messages - Riwayat percakapan
   * @param {number} [temperature=0.7] - Suhu kreativitas
   * @param {string} modelName - ID model (misal: 'deepseek/deepseek-chat')
   * @returns {string} Response text dari LLM
   */
  call(systemInstruction, messages, temperature, modelName) {
    const config = Config.load();
    const apiKey = config.openrouterApiKey;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY belum diset di Script Properties');
    }

    const targetModel = modelName || config.openrouterModelFast;

    // Format pesan sesuai standar OpenAI / OpenRouter
    const formattedMessages = [];

    if (systemInstruction) {
      formattedMessages.push({
        role: 'system',
        content: systemInstruction
      });
    }

    if (messages && messages.length > 0) {
      messages.forEach(function(msg) {
        formattedMessages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.text || msg.content || ''
        });
      });
    }

    const payload = {
      model: targetModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://github.com/' + (config.githubRepoOwner || 'bayuangga') + '/' + (config.githubRepoName || 'ai-agent-telegram'),
        'X-Title': 'AI Agent Telegram'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.API_URL, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode !== 200) {
      throw new Error('OpenRouter Error HTTP ' + statusCode + ': ' + responseText.substring(0, 200));
    }

    const data = JSON.parse(responseText);

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('OpenRouter invalid response structure: ' + responseText.substring(0, 200));
    }

    return data.choices[0].message.content;
  }
};