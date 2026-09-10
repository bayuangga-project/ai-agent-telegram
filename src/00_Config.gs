/**
 * ===================================================================
 * CONFIG
 * ===================================================================
 */
const Config = {
  _cache: null,

  load() {
    if (this._cache) return this._cache;

    const props = PropertiesService.getScriptProperties();
    this._cache = {
      telegramBotToken: props.getProperty('TELEGRAM_BOT_TOKEN'),
      myChatId: props.getProperty('MY_TELEGRAM_CHAT_ID'),
      geminiApiKey: props.getProperty('GEMINI_API_KEY'),
      geminiModelProPreview: props.getProperty('GEMINI_MODEL_PRO_PREVIEW'),
      geminiModelFlash: props.getProperty('GEMINI_MODEL_FLASH'),
      geminiModelFlashLite: props.getProperty('GEMINI_MODEL_FLASH_LITE'),
      groqApiKey: props.getProperty('GROQ_API_KEY'),
      spreadsheetId: props.getProperty('SPREADSHEET_ID'),
      sharedSecret: props.getProperty('SHARED_SECRET'),
      googleSearchApiKey: props.getProperty('GOOGLE_SEARCH_API_KEY'),
      googleSearchEngineId: props.getProperty('GOOGLE_SEARCH_ENGINE_ID'),
      tavilyApiKey: props.getProperty('TAVILY_API_KEY')
    };
    return this._cache;
  }
};