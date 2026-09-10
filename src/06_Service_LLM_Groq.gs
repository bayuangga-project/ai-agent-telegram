/**
 * ===================================================================
 * LLM PROVIDER: GROQ
 * ===================================================================
 */
const GroqProvider = {
  NAME: 'groq',
  MODEL: 'openai/gpt-oss-20b',
  ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',

  call(systemInstruction, messages, temperature) {
    const config = Config.load();
    if (!config.groqApiKey) {
      throw new Error('Groq API key tidak dikonfigurasi');
    }

    const chatMessages = [];
    if (systemInstruction) {
      chatMessages.push({ role: 'system', content: systemInstruction });
    }
    messages.forEach(m => {
      chatMessages.push({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      });
    });

    const payload = {
      model: this.MODEL,
      messages: chatMessages,
      max_tokens: 1536,
      temperature: temperature || 0.7
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + config.groqApiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.ENDPOINT, options);
    const code = response.getResponseCode();

    if (code === 429 || code === 503) {
      throw new Error('Groq overload (HTTP ' + code + ')');
    }
    if (code !== 200) {
      throw new Error('Groq HTTP error ' + code);
    }

    const data = JSON.parse(response.getContentText());
    const choice = data.choices && data.choices[0];
    if (!choice || !choice.message) {
      throw new Error('Groq tidak mengembalikan jawaban');
    }

    return choice.message.content;
  }
};