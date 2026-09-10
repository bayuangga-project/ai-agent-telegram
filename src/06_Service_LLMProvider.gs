/**
 * ===================================================================
 * LLM PROVIDER SERVICE (ORCHESTRATOR — CHAIN BASED)
 * Tanggung jawab: jalankan chain fallback sesuai kebutuhan tugas.
 *
 * - Chain 'advanced': untuk tugas yang butuh reasoning terbaik
 *   (analisis intent + percakapan natural). Urutan coba:
 *   Pro Preview -> Flash -> Flash Lite -> Groq
 * - Chain 'fast': untuk tugas sempit/mekanis (misal meringkas hasil
 *   pencarian). Urutan coba: Flash -> Flash Lite -> Groq
 * ===================================================================
 */
const LLMProviderService = {
  CHAINS: {
    advanced: [
      {
        label: 'gemini-pro-preview',
        execute: (sys, msgs, temp) =>
          GeminiProvider.call(sys, msgs, temp, Config.load().geminiModelProPreview)
      },
      {
        label: 'gemini-flash',
        execute: (sys, msgs, temp) =>
          GeminiProvider.call(sys, msgs, temp, Config.load().geminiModelFlash)
      },
      {
        label: 'gemini-flash-lite',
        execute: (sys, msgs, temp) =>
          GeminiProvider.call(sys, msgs, temp, Config.load().geminiModelFlashLite)
      },
      {
        label: 'groq',
        execute: (sys, msgs, temp) => GroqProvider.call(sys, msgs, temp)
      }
    ],
    fast: [
      {
        label: 'gemini-flash',
        execute: (sys, msgs, temp) =>
          GeminiProvider.call(sys, msgs, temp, Config.load().geminiModelFlash)
      },
      {
        label: 'gemini-flash-lite',
        execute: (sys, msgs, temp) =>
          GeminiProvider.call(sys, msgs, temp, Config.load().geminiModelFlashLite)
      },
      {
        label: 'groq',
        execute: (sys, msgs, temp) => GroqProvider.call(sys, msgs, temp)
      }
    ]
  },

  /**
   * @param {Object} params
   * @param {'advanced'|'fast'} params.chain
   * @param {string} [params.systemInstruction]
   * @param {Array<{role: 'user'|'ai', text: string}>} params.messages
   * @param {number} [params.temperature]
   * @returns {{provider: string, text: string}|null}
   */
  generate(params) {
    const { chain, systemInstruction, messages, temperature } = params;
    const steps = this.CHAINS[chain];

    if (!steps) {
      throw new Error('LLM chain tidak dikenal: ' + chain);
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        const text = step.execute(systemInstruction, messages, temperature);
        AppLogger.info('LLM_CHAIN_SUCCESS', chain + ' -> ' + step.label);
        return { provider: step.label, text: text };
      } catch (err) {
        AppLogger.warning('LLM_CHAIN_STEP_FAIL', chain + ' -> ' + step.label + ': ' + err.message);
      }
    }

    AppLogger.error('LLM_CHAIN_ALL_FAILED', 'Chain: ' + chain);
    return null;
  },

  generateFromSinglePrompt(promptText, temperature, chain) {
    return this.generate({
      chain: chain || 'fast',
      messages: [{ role: 'user', text: promptText }],
      temperature: temperature
    });
  }
};