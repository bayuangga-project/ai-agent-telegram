/**
 * ===================================================================
 * LLM PROVIDER SERVICE (ORCHESTRATOR — CHAIN BASED)
 * Tanggung jawab: jalankan chain fallback sesuai kebutuhan tugas.
 *
 * - Chain 'advanced': OpenRouter (DeepSeek V3/Sonnet) -> Gemini Pro Preview -> Gemini Flash -> Groq
 * - Chain 'fast': OpenRouter (Gemini 2.0 Flash / DeepSeek) -> Gemini Flash -> Groq
 * ===================================================================
 */
const LLMProviderService = {
  CHAINS: {
    advanced: [
      {
        label: 'openrouter-advanced',
        execute: (sys, msgs, temp) =>
          OpenRouterProvider.call(sys, msgs, temp, Config.load().openrouterModelAdvanced)
      },
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
        label: 'openrouter-fast',
        execute: (sys, msgs, temp) =>
          OpenRouterProvider.call(sys, msgs, temp, Config.load().openrouterModelFast)
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