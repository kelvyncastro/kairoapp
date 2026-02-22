/**
 * Detects if a text contains food/ingredient-related words.
 * Returns true if enough food keywords are found.
 * Uses word-boundary matching to avoid false positives from partial matches.
 */

const FOOD_KEYWORDS = [
  // Grãos e cereais
  'arroz', 'feijão', 'feijao', 'lentilha', 'grão de bico', 'grao de bico', 'aveia', 'quinoa',
  'macarrão', 'macarrao', 'espaguete', 'penne', 'lasanha', 'farinha', 'fubá', 'fuba',
  'trigo', 'granola', 'cereal', 'pão', 'pao', 'torrada', 'biscoito', 'bolacha',
  // Proteínas
  'frango', 'carne', 'peixe', 'camarão', 'camarao', 'ovos', 'presunto', 'salsicha',
  'linguiça', 'linguica', 'bacon', 'peito de frango', 'filé', 'file', 'alcatra',
  'picanha', 'costela', 'sardinha', 'atum', 'salmão', 'salmao', 'tilápia', 'tilapia',
  'carne moída', 'carne moida', 'hambúrguer', 'hamburguer', 'salame', 'mortadela',
  // Laticínios
  'leite', 'queijo', 'iogurte', 'manteiga', 'margarina', 'creme de leite', 'requeijão',
  'requeijao', 'ricota', 'mussarela', 'parmesão', 'parmesao', 'coalhada',
  // Frutas
  'banana', 'maçã', 'maca', 'laranja', 'limão', 'limao', 'morango', 'uva', 'manga',
  'abacaxi', 'melancia', 'melão', 'melao', 'mamão', 'mamao', 'kiwi', 'goiaba',
  'abacate', 'maracujá', 'maracuja', 'ameixa', 'pêssego', 'pessego', 'cereja',
  'framboesa', 'mirtilo', 'tangerina', 'mexerica', 'acerola', 'jabuticaba',
  // Verduras e legumes
  'alface', 'tomate', 'cebola', 'alho', 'batata', 'cenoura', 'brócolis', 'brocolis',
  'couve', 'espinafre', 'rúcula', 'rucula', 'pepino', 'abobrinha', 'abóbora', 'abobora',
  'berinjela', 'pimentão', 'pimentao', 'vagem', 'ervilha', 'milho verde', 'beterraba',
  'repolho', 'couve-flor', 'mandioca', 'inhame', 'quiabo', 'jiló', 'jilo',
  'agrião', 'agriao', 'gengibre', 'salsinha', 'cebolinha', 'coentro', 'cheiro verde',
  // Temperos e condimentos
  'açúcar', 'acucar', 'orégano', 'oregano', 'cominho', 'canela',
  'cúrcuma', 'curcuma', 'vinagre', 'azeite', 'molho de soja', 'shoyu', 'mostarda', 'ketchup',
  'maionese', 'molho de tomate', 'extrato de tomate',
  // Bebidas
  'café', 'cafe', 'suco', 'refrigerante', 'cerveja', 'vinho',
  // Outros
  'chocolate', 'cacau', 'gelatina', 'fermento', 'tapioca',
  'amendoim', 'castanha', 'nozes', 'amêndoa', 'amendoa', 'pistache',
  'leite condensado', 'chantilly', 'sorvete',
];

const MIN_MATCHES = 5;

export function detectFoodIngredients(text: string): boolean {
  if (!text || text.length < 20) return false;
  
  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  let matches = 0;
  
  for (const keyword of FOOD_KEYWORDS) {
    const normalizedKeyword = keyword
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    // Use word boundary matching to avoid partial matches
    const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[\\s,;.!?()\\[\\]{}:/"'])${escaped}(?:$|[\\s,;.!?()\\[\\]{}:/"'s])`, 'i');
    
    if (regex.test(normalized)) {
      matches++;
      if (matches >= MIN_MATCHES) return true;
    }
  }
  
  return false;
}
