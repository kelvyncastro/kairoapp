/**
 * Detects if a text contains food/ingredient-related words.
 * Returns true if enough food keywords are found.
 */

const FOOD_KEYWORDS = new Set([
  // Grãos e cereais
  'arroz', 'feijão', 'feijao', 'lentilha', 'grão de bico', 'grao de bico', 'aveia', 'quinoa',
  'macarrão', 'macarrao', 'massa', 'espaguete', 'penne', 'lasanha', 'farinha', 'fubá', 'fuba',
  'trigo', 'milho', 'granola', 'cereal', 'pão', 'pao', 'torrada', 'biscoito', 'bolacha',
  // Proteínas
  'frango', 'carne', 'peixe', 'camarão', 'camarao', 'ovo', 'ovos', 'presunto', 'salsicha',
  'linguiça', 'linguica', 'bacon', 'peito de frango', 'coxinha', 'filé', 'file', 'alcatra',
  'picanha', 'costela', 'sardinha', 'atum', 'salmão', 'salmao', 'tilápia', 'tilapia',
  'carne moída', 'carne moida', 'hambúrguer', 'hamburguer', 'salame', 'mortadela',
  // Laticínios
  'leite', 'queijo', 'iogurte', 'manteiga', 'margarina', 'creme de leite', 'requeijão',
  'requeijao', 'ricota', 'mussarela', 'parmesão', 'parmesao', 'nata', 'coalhada',
  // Frutas
  'banana', 'maçã', 'maca', 'laranja', 'limão', 'limao', 'morango', 'uva', 'manga',
  'abacaxi', 'melancia', 'melão', 'melao', 'mamão', 'mamao', 'pera', 'kiwi', 'goiaba',
  'abacate', 'coco', 'maracujá', 'maracuja', 'ameixa', 'pêssego', 'pessego', 'cereja',
  'framboesa', 'mirtilo', 'tangerina', 'mexerica', 'acerola', 'jabuticaba',
  // Verduras e legumes
  'alface', 'tomate', 'cebola', 'alho', 'batata', 'cenoura', 'brócolis', 'brocolis',
  'couve', 'espinafre', 'rúcula', 'rucula', 'pepino', 'abobrinha', 'abóbora', 'abobora',
  'berinjela', 'pimentão', 'pimentao', 'vagem', 'ervilha', 'milho verde', 'beterraba',
  'repolho', 'couve-flor', 'mandioca', 'inhame', 'cará', 'cara', 'quiabo', 'jiló', 'jilo',
  'agrião', 'agriao', 'salsão', 'salsao', 'gengibre', 'hortelã', 'hortela', 'manjericão',
  'manjericao', 'salsinha', 'cebolinha', 'coentro', 'cheiro verde',
  // Temperos e condimentos
  'sal', 'açúcar', 'acucar', 'pimenta', 'orégano', 'oregano', 'cominho', 'canela',
  'cravo', 'noz moscada', 'curry', 'páprica', 'paprica', 'cúrcuma', 'curcuma',
  'vinagre', 'azeite', 'óleo', 'oleo', 'molho de soja', 'shoyu', 'mostarda', 'ketchup',
  'maionese', 'molho de tomate', 'extrato de tomate',
  // Bebidas
  'café', 'cafe', 'chá', 'cha', 'suco', 'água', 'agua', 'refrigerante', 'cerveja', 'vinho',
  // Outros
  'chocolate', 'cacau', 'mel', 'gelatina', 'fermento', 'amido', 'polvilho', 'tapioca',
  'creme', 'molho', 'massa de tomate', 'extrato', 'essência', 'essencia', 'baunilha',
  'amendoim', 'castanha', 'nozes', 'amêndoa', 'amendoa', 'pistache',
  'leite condensado', 'creme de leite', 'chantilly', 'sorvete', 'pudim',
]);

const MIN_MATCHES = 3;

export function detectFoodIngredients(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  let matches = 0;
  
  for (const keyword of FOOD_KEYWORDS) {
    const normalizedKeyword = keyword
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    if (normalized.includes(normalizedKeyword)) {
      matches++;
      if (matches >= MIN_MATCHES) return true;
    }
  }
  
  return false;
}
