export interface ConfeitariaProduct {
  id: string
  name: string
  category: string
  price: number
  servings?: string
  prepTime?: string
  badge?: string
  dietary?: string[]
  description?: string
  isActive: boolean
  image: string
}

export const CATEGORIES_CONFEITARIA = [
  'Bolos Festivos',
  'Bento Cakes',
  'Doces Finos',
  'Fatias & Pedaços',
  'Sobremesas na Taça'
]

export const POPULAR_BADGES_CONFEITARIA = [
  'Nenhum',
  'Mais Pedido 🍓',
  'Destaque ✨',
  'Presente Perfeito 🎁',
  'Edição Limitada ⏳',
  'Artesanal 🍫',
  'Sucesso das Tardes ☕'
]

export const DIETARY_OPTIONS_CONFEITARIA = [
  'Sem Glúten (Gluten-Free)',
  'Sem Lactose',
  'Vegano (Zero Origem Animal)',
  'Sem Açúcar / Low Carb',
  'Contém Nozes / Castanhas',
  'Artesanal & Sem Conservantes'
]

export const DEFAULT_CONFEITARIA_PRODUCTS: ConfeitariaProduct[] = [
  {
    id: '1',
    name: 'Bolo Red Velvet Supreme com Frutas Vermelhas',
    category: 'Bolos Festivos',
    price: 185.00,
    servings: '15 a 20 fatias',
    prepTime: '24h antecedência',
    badge: 'Mais Pedido 🍓',
    dietary: ['Artesanal & Sem Conservantes'],
    description: 'Massa aveludada clássica com toque suave de cacau especial, recheio generoso e equilibrado de cream cheese frosting importado. Finalizado com morangos frescos e mirtilos selecionados à mão.',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    name: 'Bolo Trufado Chocomenta & Ninho',
    category: 'Bolos Festivos',
    price: 165.00,
    servings: '12 a 15 fatias',
    prepTime: '24h antecedência',
    badge: 'Destaque ✨',
    dietary: ['Artesanal & Sem Conservantes'],
    description: 'Camadas de massa úmida de cacau black 70%, recheio duplo de ganache trufada meio amarga aromatizada com menta e brigadeiro cremoso de Leite Ninho.',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    name: 'Bento Cake Personalizado Divertido',
    category: 'Bento Cakes',
    price: 55.00,
    servings: '1 a 2 pessoas',
    prepTime: 'Pronta entrega ou 12h',
    badge: 'Presente Perfeito 🎁',
    dietary: ['Artesanal & Sem Conservantes'],
    description: 'Mini bolo na marmitinha com frases divertidas e memes personalizados. Perfeito para presentear!',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '4',
    name: 'Torta Cheesecake New York com Calda de Maracujá',
    category: 'Sobremesas na Taça',
    price: 140.00,
    servings: '10 fatias',
    prepTime: '24h antecedência',
    badge: '',
    dietary: ['Artesanal & Sem Conservantes'],
    description: 'Cheesecake clássica assada lentamente, com base crocante de biscoito e calda artesanal de maracujá fresco.',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '5',
    name: 'Caixa Degustação de Brigadeiros Gourmet (12 un)',
    category: 'Doces Finos',
    price: 48.00,
    servings: '12 unidades',
    prepTime: 'Pronta entrega',
    badge: 'Artesanal 🍫',
    dietary: ['Sem Glúten (Gluten-Free)', 'Artesanal & Sem Conservantes'],
    description: 'Seleção dos nossos melhores sabores: Belga Tradicional, Pistache, Ninho com Nutella e Frutas Vermelhas.',
    isActive: false,
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
  }
]

const STORAGE_KEY = 'confeitaria_custom_products'

export function getConfeitariaProducts(): ConfeitariaProduct[] {
  if (typeof window === 'undefined') return DEFAULT_CONFEITARIA_PRODUCTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFEITARIA_PRODUCTS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CONFEITARIA_PRODUCTS
  } catch {
    return DEFAULT_CONFEITARIA_PRODUCTS
  }
}

export function saveConfeitariaProduct(product: ConfeitariaProduct): void {
  if (typeof window === 'undefined') return
  try {
    const list = getConfeitariaProducts()
    const index = list.findIndex(p => p.id === product.id)
    if (index >= 0) {
      list[index] = product
    } else {
      list.unshift(product)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Erro ao salvar produto:', e)
  }
}

export function deleteConfeitariaProduct(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const list = getConfeitariaProducts().filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Erro ao excluir produto:', e)
  }
}
