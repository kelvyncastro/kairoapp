/**
 * Detects if a text contains food/ingredient-related words in a list-like context.
 * Analyzes both keyword count AND structure (lists, line-by-line items) to avoid
 * false positives from normal text that happens to mention food words.
 */

const FOOD_KEYWORDS = [
  // Grãos e cereais
  'arroz', 'feijão', 'feijao', 'lentilha', 'grão de bico', 'grao de bico', 'aveia', 'quinoa',
  'macarrão', 'macarrao', 'espaguete', 'penne', 'lasanha', 'farinha', 'fubá', 'fuba',
  'trigo', 'granola', 'cereal', 'pão', 'pao', 'torrada', 'biscoito', 'bolacha',
  // Proteínas
  'frango', 'carne', 'peixe', 'camarão', 'camarao', 'ovo', 'ovos', 'presunto', 'salsicha',
  'linguiça', 'linguica', 'bacon', 'peito de frango', 'filé', 'file', 'alcatra',
  'picanha', 'costela', 'sardinha', 'atum', 'salmão', 'salmao', 'tilápia', 'tilapia',
  'carne moída', 'carne moida', 'hambúrguer', 'hamburguer', 'salame', 'mortadela',
  // Laticínios
  'leite', 'queijo', 'iogurte', 'manteiga', 'margarina', 'creme de leite', 'requeijão',
  'requeijao', 'ricota', 'mussarela', 'parmesão', 'parmesao', 'coalhada',
  // Frutas
  'banana', 'maçã', 'maca', 'laranja', 'limão', 'limao', 'morango', 'uva', 'manga',
  'abacaxi', 'melancia', 'melão', 'melao', 'mamão', 'mamao', 'kiwi', 'goiaba',
  'abacate', 'coco', 'maracujá', 'maracuja', 'ameixa', 'pêssego', 'pessego', 'cereja',
  'framboesa', 'mirtilo', 'tangerina', 'mexerica', 'acerola', 'jabuticaba',
  // Verduras e legumes
  'alface', 'tomate', 'cebola', 'alho', 'batata', 'cenoura', 'brócolis', 'brocolis',
  'couve', 'espinafre', 'rúcula', 'rucula', 'pepino', 'abobrinha', 'abóbora', 'abobora',
  'berinjela', 'pimentão', 'pimentao', 'vagem', 'ervilha', 'milho verde', 'beterraba',
  'repolho', 'couve-flor', 'mandioca', 'inhame', 'quiabo', 'jiló', 'jilo',
  'agrião', 'agriao', 'gengibre', 'hortelã', 'hortela', 'manjericão', 'manjericao',
  'salsinha', 'cebolinha', 'coentro', 'cheiro verde',
  // Temperos e condimentos
  'sal', 'açúcar', 'acucar', 'pimenta', 'orégano', 'oregano', 'cominho', 'canela',
  'cúrcuma', 'curcuma', 'vinagre', 'azeite', 'óleo', 'oleo', 'molho de soja', 'shoyu',
  'mostarda', 'ketchup', 'maionese', 'molho de tomate', 'extrato de tomate',
  // Bebidas
  'café', 'cafe', 'chá', 'cha', 'suco', 'refrigerante', 'cerveja', 'vinho',
  // Outros
  'chocolate', 'cacau', 'mel', 'gelatina', 'fermento', 'amido', 'polvilho', 'tapioca',
  'creme', 'molho', 'amendoim', 'castanha', 'nozes', 'amêndoa', 'amendoa', 'pistache',
  'leite condensado', 'chantilly', 'sorvete',
];

// Words that are food but also very common in normal text — only count if in list context
const AMBIGUOUS_WORDS = new Set(
  ['sal', 'mel', 'cha', 'chá', 'coco', 'manga', 'creme', 'molho', 'oleo', 'óleo', 'ovo', 'uva', 'pera']
    .map(w => w.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
);

/**
 * Check if text has a list-like structure (bullet points, numbered items, 
 * short lines separated by newlines — typical of ingredient/grocery lists).
 */
function hasListStructure(text: string): boolean {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) return false;
  
  let shortLines = 0;
  let listMarkers = 0;
  
  for (const line of lines) {
    if (line.length < 40) shortLines++;
    if (/^[-•*·◦▪▸►→]\s|^\d+[.)]\s|^☐|^✓|^✔|^\[\s?\]/.test(line)) listMarkers++;
  }
  
  // Consider it a list if many short lines or has explicit list markers
  return listMarkers >= 2 || (shortLines / lines.length > 0.5 && lines.length >= 4);
}

export function detectFoodIngredients(text: string): boolean {
  if (!text || text.length < 20) return false;
  
  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  const isList = hasListStructure(text);
  
  let matches = 0;
  let strongMatches = 0; // non-ambiguous food words
  
  for (const keyword of FOOD_KEYWORDS) {
    const normalizedKeyword = keyword
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    // Use word boundary matching
    const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[\\s,;.!?()\\[\\]{}:/"'\\-•*])${escaped}(?:$|[\\s,;.!?()\\[\\]{}:/"'\\-•*s])`, 'i');
    
    if (regex.test(normalized)) {
      const isAmbiguous = AMBIGUOUS_WORDS.has(normalizedKeyword);
      if (!isAmbiguous) strongMatches++;
      matches++;
    }
  }
  
  // If it's a list structure, lower threshold (likely a grocery/recipe list)
  if (isList) return strongMatches >= 3 || matches >= 5;
  
  // For normal text (paragraphs), require much higher confidence
  return strongMatches >= 6 && matches >= 8;
}
