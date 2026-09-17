const TemplateEngine = {
  render(template, variables) {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, function(match, key) {
      return variables.hasOwnProperty(key) ? String(variables[key]) : match;
    });
  }
};