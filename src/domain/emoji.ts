import { nameKey } from './normalize';
import { Category } from './types';

/** Shown when a name matches nothing and no category is known. */
export const DEFAULT_EMOJI = '🍽️';

/** Coarse fallback when a name matches no specific food. */
export const CATEGORY_EMOJI: Record<Category, string> = {
  produce: '🥬',
  dairy: '🧀',
  meat: '🥩',
  seafood: '🐟',
  bakery: '🍞',
  pantry: '🥫',
  frozen: '🧊',
  drinks: '🧃',
  other: DEFAULT_EMOJI,
};

/**
 * Every food emoji we can render, with the words that should map onto it.
 * Authored emoji-first so synonyms stay together; `FOOD_EMOJI` below is the
 * flat word -> emoji lookup derived from it.
 *
 * A word must appear in only one group. Earlier groups win a tie, so the more
 * specific food comes first where two lists would otherwise overlap.
 */
const EMOJI_WORDS: [string, string[]][] = [
  // --- Fruit ---------------------------------------------------------------
  ['🍎', ['apple', 'red apple', 'gala', 'braeburn', 'pink lady', 'fuji', 'jazz apple', 'cox']],
  ['🍏', ['green apple', 'granny smith', 'bramley', 'cooking apple']],
  ['🍌', ['banana', 'plantain', 'banana bunch']],
  ['🍊', ['orange', 'tangerine', 'clementine', 'mandarin', 'satsuma', 'citrus', 'blood orange']],
  ['🍋', ['lemon', 'lime', 'lemon zest', 'lime zest', 'lemon juice', 'lime juice', 'citron']],
  ['🍇', ['grape', 'red grape', 'green grape', 'raisin', 'sultana', 'currant']],
  ['🍓', ['strawberry', 'strawberries']],
  ['🫐', ['blueberry', 'blackberry', 'raspberry', 'berry', 'cranberry', 'blackcurrant', 'gooseberry', 'elderberry', 'redcurrant']],
  ['🍒', ['cherry', 'cherries', 'glace cherry']],
  ['🍑', ['peach', 'nectarine', 'apricot']],
  ['🍐', ['pear', 'conference pear', 'quince']],
  ['🍍', ['pineapple']],
  ['🥭', ['mango', 'papaya', 'guava', 'passion fruit', 'lychee']],
  ['🍉', ['watermelon']],
  ['🍈', ['melon', 'cantaloupe', 'honeydew', 'galia']],
  ['🥝', ['kiwi', 'kiwi fruit']],
  ['🥥', ['coconut', 'coconut milk', 'coconut cream', 'desiccated coconut']],
  ['🫒', ['olive', 'olive oil', 'black olive', 'green olive', 'kalamata']],
  ['🍅', ['tomato', 'cherry tomato', 'plum tomato', 'vine tomato', 'beef tomato']],
  ['🥑', ['avocado', 'guacamole']],

  // --- Vegetables ----------------------------------------------------------
  ['🥕', ['carrot', 'baby carrot', 'parsnip', 'swede', 'turnip', 'beetroot', 'beet']],
  ['🥔', ['potato', 'new potato', 'baby potato', 'maris piper', 'king edward', 'mash', 'mashed potato', 'hash brown', 'roast potato', 'jacket potato']],
  ['🍠', ['sweet potato', 'yam', 'butternut squash', 'squash', 'pumpkin']],
  ['🧅', ['onion', 'red onion', 'white onion', 'brown onion', 'shallot', 'spring onion', 'scallion', 'leek']],
  ['🧄', ['garlic', 'garlic clove', 'garlic paste', 'garlic powder']],
  ['🫚', ['ginger', 'root ginger', 'turmeric', 'galangal', 'horseradish']],
  ['🥬', ['lettuce', 'spinach', 'kale', 'cabbage', 'greens', 'rocket', 'arugula', 'chard', 'pak choi', 'bok choy', 'romaine', 'iceberg', 'salad leaves', 'watercress', 'sprouts', 'brussels sprout', 'endive', 'radicchio']],
  ['🥦', ['broccoli', 'cauliflower', 'tenderstem', 'romanesco', 'purple sprouting']],
  ['🥒', ['cucumber', 'courgette', 'zucchini', 'gherkin', 'pickle', 'pickled cucumber']],
  ['🍆', ['aubergine', 'eggplant', 'baba ganoush']],
  ['🫑', ['pepper', 'bell pepper', 'capsicum', 'red pepper', 'green pepper', 'yellow pepper', 'romano pepper']],
  ['🌶️', ['chilli', 'chili', 'chile', 'jalapeno', 'cayenne', 'paprika', 'sriracha', 'harissa', 'chipotle', 'habanero', 'scotch bonnet', 'chilli flakes', 'hot sauce', 'tabasco']],
  ['🌽', ['corn', 'sweetcorn', 'maize', 'corn on the cob', 'baby corn', 'popcorn kernel']],
  ['🍄', ['mushroom', 'chestnut mushroom', 'button mushroom', 'portobello', 'shiitake', 'oyster mushroom', 'porcini', 'truffle']],
  ['🫛', ['pea', 'peas', 'garden pea', 'mangetout', 'sugar snap', 'edamame', 'green bean', 'runner bean', 'asparagus', 'okra', 'celery', 'fennel', 'artichoke', 'rhubarb', 'radish']],
  ['🫘', ['bean', 'black bean', 'kidney bean', 'butter bean', 'cannellini', 'pinto bean', 'borlotti', 'baked beans', 'chickpea', 'lentil', 'red lentil', 'split pea', 'soy bean']],

  // --- Herbs, spices, seasoning -------------------------------------------
  ['🌿', ['herb', 'basil', 'parsley', 'coriander', 'cilantro', 'mint', 'thyme', 'rosemary', 'oregano', 'sage', 'dill', 'chives', 'bay leaf', 'tarragon', 'marjoram', 'lemongrass']],
  ['🧂', ['salt', 'sea salt', 'black pepper', 'peppercorn', 'white pepper', 'seasoning', 'spice', 'cumin', 'coriander seed', 'cinnamon', 'nutmeg', 'cardamom', 'clove', 'curry powder', 'garam masala', 'five spice', 'baking powder', 'bicarbonate of soda', 'yeast', 'msg', 'stock cube', 'bouillon']],

  // --- Dairy and eggs ------------------------------------------------------
  ['🥛', ['milk', 'whole milk', 'semi skimmed', 'skimmed milk', 'oat milk', 'almond milk', 'soy milk', 'soya milk', 'buttermilk', 'cream', 'double cream', 'single cream', 'sour cream', 'creme fraiche', 'yoghurt', 'yogurt', 'greek yoghurt', 'kefir', 'condensed milk', 'evaporated milk', 'milk powder', 'custard']],
  ['🧀', ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'brie', 'gouda', 'halloumi', 'ricotta', 'mascarpone', 'camembert', 'gruyere', 'edam', 'manchego', 'stilton', 'blue cheese', 'goat cheese', 'cottage cheese', 'cream cheese', 'paneer', 'emmental', 'provolone', 'pecorino', 'quark']],
  ['🧈', ['butter', 'margarine', 'ghee', 'spread', 'lard', 'dripping']],
  ['🥚', ['egg', 'eggs', 'egg white', 'egg yolk', 'quail egg', 'duck egg']],
  ['🍳', ['fried egg', 'omelette', 'omelet', 'scrambled egg', 'poached egg', 'frittata', 'boiled egg']],

  // --- Meat ----------------------------------------------------------------
  ['🥩', ['steak', 'beef', 'mince', 'minced beef', 'ground beef', 'sirloin', 'ribeye', 'rump', 'fillet', 'brisket', 'lamb', 'lamb chop', 'veal', 'venison', 'pork', 'pork chop', 'pork loin', 'meat', 'goat']],
  ['🍗', ['chicken', 'chicken breast', 'chicken thigh', 'drumstick', 'chicken wing', 'poultry', 'turkey', 'duck', 'goose', 'chicken fillet', 'roast chicken']],
  ['🍖', ['rib', 'ribs', 'gammon', 'roast', 'joint', 'shank', 'pulled pork', 'brisket joint', 'oxtail']],
  ['🥓', ['bacon', 'pancetta', 'lardon', 'streaky bacon', 'back bacon', 'prosciutto', 'parma ham', 'ham', 'serrano']],
  ['🌭', ['sausage', 'hot dog', 'frankfurter', 'bratwurst', 'chorizo', 'salami', 'pepperoni', 'chipolata', 'kielbasa', 'black pudding', 'cured sausage']],
  ['🧆', ['falafel', 'meatball', 'kofta', 'nugget', 'chicken nugget', 'croquette', 'arancini']],

  // --- Fish and seafood ----------------------------------------------------
  ['🐟', ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'mackerel', 'sardine', 'anchovy', 'trout', 'sea bass', 'pollock', 'plaice', 'halibut', 'herring', 'tilapia', 'fish finger', 'smoked salmon']],
  ['🍤', ['prawn', 'shrimp', 'king prawn', 'tempura', 'scampi', 'langoustine']],
  ['🦀', ['crab', 'crab stick', 'crab meat']],
  ['🦞', ['lobster', 'crayfish']],
  ['🦑', ['squid', 'calamari', 'octopus', 'cuttlefish']],
  ['🦪', ['oyster', 'mussel', 'clam', 'scallop', 'cockle', 'whelk', 'shellfish']],
  ['🍣', ['sushi', 'sashimi', 'nigiri', 'maki', 'poke']],

  // --- Bakery --------------------------------------------------------------
  ['🍞', ['bread', 'loaf', 'toast', 'sourdough', 'brioche', 'sliced bread', 'wholemeal', 'white bread', 'brown bread', 'rye bread', 'ciabatta', 'focaccia', 'bread roll', 'bun', 'breadcrumbs', 'crouton']],
  ['🥖', ['baguette', 'french stick', 'batard']],
  ['🥐', ['croissant', 'pastry', 'danish', 'pain au chocolat', 'puff pastry', 'filo', 'shortcrust', 'scone']],
  ['🥯', ['bagel', 'english muffin', 'crumpet']],
  ['🫓', ['tortilla', 'wrap', 'pita', 'pitta', 'flatbread', 'naan', 'chapati', 'roti', 'taco shell', 'crackers', 'cracker', 'crispbread', 'oatcake', 'poppadom']],
  ['🥨', ['pretzel', 'breadstick', 'grissini']],
  ['🥞', ['pancake', 'crepe', 'blini', 'drop scone']],
  ['🧇', ['waffle']],

  // --- Prepared and takeaway ----------------------------------------------
  ['🍕', ['pizza', 'margherita', 'calzone', 'pizza base']],
  ['🍔', ['burger', 'cheeseburger', 'hamburger', 'beefburger', 'patty', 'veggie burger']],
  ['🍟', ['fries', 'french fries', 'chips', 'crisps', 'potato chips', 'wedges', 'curly fries']],
  ['🥪', ['sandwich', 'toastie', 'panini', 'sub', 'baguette sandwich', 'blt', 'club sandwich']],
  ['🌮', ['taco', 'nachos', 'quesadilla', 'tostada']],
  ['🌯', ['burrito', 'wrap sandwich', 'shawarma', 'doner']],
  ['🥙', ['kebab', 'gyro', 'souvlaki', 'stuffed pita']],
  ['🫔', ['tamale', 'empanada']],
  ['🥗', ['salad', 'coleslaw', 'slaw', 'caesar salad', 'side salad', 'greek salad', 'tabbouleh']],
  ['🍲', ['soup', 'stew', 'broth', 'casserole', 'chowder', 'hotpot', 'goulash', 'chilli con carne', 'ramen broth', 'minestrone']],
  ['🍛', ['curry', 'korma', 'tikka masala', 'balti', 'madras', 'dhal', 'dal', 'katsu', 'thai curry']],
  ['🥘', ['paella', 'risotto', 'jambalaya', 'tagine', 'stir fry', 'traybake']],
  ['🫕', ['fondue', 'raclette', 'dip', 'hummus', 'tzatziki', 'salsa', 'guac', 'aioli']],
  ['🥟', ['dumpling', 'gyoza', 'pierogi', 'wonton', 'samosa', 'spring roll', 'ravioli', 'tortellini']],
  ['🍱', ['bento', 'meal deal', 'ready meal']],
  ['🥡', ['takeaway', 'takeout', 'leftovers']],

  // --- Grains, pasta, staples ---------------------------------------------
  ['🍚', ['rice', 'basmati', 'jasmine rice', 'arborio', 'long grain', 'brown rice', 'white rice', 'wild rice', 'sticky rice']],
  ['🍝', ['pasta', 'spaghetti', 'penne', 'fusilli', 'macaroni', 'tagliatelle', 'linguine', 'lasagne', 'lasagna', 'rigatoni', 'farfalle', 'orzo', 'conchiglie', 'gnocchi', 'bolognese', 'carbonara']],
  ['🍜', ['noodle', 'noodles', 'ramen', 'udon', 'soba', 'rice noodle', 'egg noodle', 'pho', 'vermicelli', 'pot noodle']],
  ['🌾', ['flour', 'plain flour', 'self raising flour', 'bread flour', 'wheat', 'bran', 'barley', 'rye', 'semolina', 'cornmeal', 'polenta', 'quinoa', 'couscous', 'bulgur', 'buckwheat', 'cornflour', 'grain']],
  ['🥣', ['cereal', 'porridge', 'oats', 'oatmeal', 'muesli', 'granola', 'cornflakes', 'weetabix', 'bran flakes', 'shredded wheat', 'rice krispies']],
  ['🥫', ['tin', 'can', 'tinned', 'canned', 'tinned tomato', 'chopped tomato', 'passata', 'tomato puree', 'tomato paste', 'sauce', 'ketchup', 'brown sauce', 'bbq sauce', 'soy sauce', 'fish sauce', 'worcestershire', 'gravy', 'stock', 'tinned fish', 'canned food', 'baked bean tin']],
  ['🫙', ['jam', 'marmalade', 'jelly', 'preserve', 'chutney', 'relish', 'pesto', 'tahini', 'marmite', 'mayonnaise', 'mayo', 'mustard', 'horseradish sauce', 'pickled onion']],
  ['🫗', ['oil', 'vegetable oil', 'sunflower oil', 'rapeseed oil', 'coconut oil', 'sesame oil', 'vinegar', 'balsamic', 'dressing', 'vinaigrette', 'cooking oil']],
  ['🍯', ['honey', 'syrup', 'maple syrup', 'agave', 'molasses', 'treacle', 'golden syrup']],
  ['🍬', ['sugar', 'caster sugar', 'icing sugar', 'brown sugar', 'sweetener', 'candy', 'sweets', 'haribo', 'toffee', 'fudge', 'marshmallow', 'mint sweets']],
  ['🥜', ['peanut', 'peanut butter', 'groundnut', 'monkey nut']],
  ['🌰', ['nut', 'nuts', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'chestnut', 'brazil nut', 'macadamia', 'pine nut', 'mixed nuts', 'seed', 'sunflower seed', 'pumpkin seed', 'chia', 'flaxseed', 'sesame']],

  // --- Sweets and desserts -------------------------------------------------
  ['🍫', ['chocolate', 'cocoa', 'nutella', 'chocolate chip', 'dark chocolate', 'milk chocolate', 'white chocolate', 'brownie', 'chocolate bar']],
  ['🍪', ['biscuit', 'cookie', 'digestive', 'oreo', 'shortbread', 'hobnob', 'ginger nut', 'wafer']],
  ['🍰', ['cake', 'cheesecake', 'sponge', 'victoria sponge', 'carrot cake', 'banana bread', 'battenberg', 'swiss roll', 'tiramisu']],
  ['🎂', ['birthday cake', 'celebration cake']],
  ['🧁', ['cupcake', 'muffin', 'fairy cake', 'blueberry muffin']],
  ['🥧', ['pie', 'apple pie', 'tart', 'quiche', 'pasty', 'sausage roll', 'crumble', 'cobbler']],
  ['🍩', ['doughnut', 'donut', 'churro']],
  ['🍮', ['pudding', 'flan', 'panna cotta', 'creme caramel', 'mousse', 'trifle', 'jelly dessert']],
  ['🍦', ['ice cream', 'gelato', 'soft serve', 'sorbet', 'frozen yoghurt', 'ice lolly', 'popsicle']],
  ['🍿', ['popcorn']],

  // --- Drinks --------------------------------------------------------------
  ['☕', ['coffee', 'espresso', 'latte', 'cappuccino', 'americano', 'mocha', 'instant coffee', 'decaf', 'coffee beans', 'flat white', 'filter coffee']],
  ['🍵', ['tea', 'green tea', 'matcha', 'herbal tea', 'chamomile', 'earl grey', 'teabag', 'peppermint tea', 'chai']],
  ['🧃', ['juice', 'orange juice', 'apple juice', 'cranberry juice', 'squash drink', 'cordial', 'fruit juice']],
  ['🥤', ['soda', 'cola', 'coke', 'pepsi', 'lemonade', 'fizzy drink', 'soft drink', 'smoothie', 'milkshake', 'energy drink', 'tonic', 'ginger ale', 'iced tea']],
  ['💧', ['water', 'sparkling water', 'still water', 'mineral water', 'tap water', 'soda water']],
  ['🍺', ['beer', 'lager', 'ale', 'ipa', 'stout', 'cider', 'craft beer', 'pale ale']],
  ['🍷', ['wine', 'red wine', 'white wine', 'rose wine', 'merlot', 'cabernet', 'chardonnay', 'sauvignon', 'pinot', 'malbec', 'rioja', 'port']],
  ['🍾', ['champagne', 'prosecco', 'sparkling wine', 'cava']],
  ['🥃', ['whisky', 'whiskey', 'bourbon', 'scotch', 'rum', 'brandy', 'cognac', 'liqueur']],
  ['🍸', ['cocktail', 'martini', 'gin', 'vodka', 'tequila', 'aperitif', 'vermouth']],
  ['🍹', ['mocktail', 'punch', 'sangria', 'pina colada', 'mojito']],
  ['🍶', ['sake', 'soju', 'rice wine']],
  ['🧋', ['bubble tea', 'boba']],
  ['🧉', ['mate', 'yerba mate']],
  ['🧊', ['ice', 'ice cubes', 'frozen']],
  ['🍼', ['formula', 'baby milk', 'baby food']],
];

/**
 * Flat lookup of lowercase word -> emoji. Both the word as written and its
 * normalized form are registered, so "fries" and its singular "fry" both hit.
 * First group to claim a word keeps it.
 */
export const FOOD_EMOJI: Record<string, string> = {};

for (const [emoji, words] of EMOJI_WORDS) {
  for (const word of words) {
    for (const key of [word.toLowerCase(), nameKey(word)]) {
      if (key && FOOD_EMOJI[key] === undefined) FOOD_EMOJI[key] = emoji;
    }
  }
}

/** Longest key we bother scanning for in the substring pass. */
const MIN_SUBSTRING_LENGTH = 5;

/**
 * Best emoji for a phrase already reduced to words: try the longest run of
 * words first so "olive oil" beats "oil" and "ice cream" beats "cream", and
 * scan right to left within a length so the head noun wins ("chicken soup"
 * is soup, not chicken).
 */
function matchWords(words: string[]): string | null {
  for (let size = words.length; size >= 1; size--) {
    for (let start = words.length - size; start >= 0; start--) {
      const hit = FOOD_EMOJI[words.slice(start, start + size).join(' ')];
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Emoji that best describes a food name, falling back to the category and then
 * to a generic plate. Matching runs over both the normalized key and the raw
 * text, since normalization drops words ("frozen", "low fat") that a few
 * entries are keyed on.
 */
export function foodEmoji(name: string, category?: Category): string {
  const raw = name.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const key = nameKey(name);

  for (const phrase of key === raw ? [key] : [key, raw]) {
    if (!phrase) continue;
    const hit = matchWords(phrase.split(' '));
    if (hit) return hit;
  }

  // Last resort for compounds written as one word ("garlicbread"). The match
  // ending furthest right wins, keeping the head-noun preference above; length
  // breaks a tie between two that end together.
  let best: { end: number; length: number; emoji: string } | null = null;
  for (const [word, emoji] of Object.entries(FOOD_EMOJI)) {
    if (word.length < MIN_SUBSTRING_LENGTH) continue;
    const at = key.lastIndexOf(word);
    if (at < 0) continue;
    const end = at + word.length;
    if (!best || end > best.end || (end === best.end && word.length > best.length)) {
      best = { end, length: word.length, emoji };
    }
  }
  if (best) return best.emoji;

  return category ? CATEGORY_EMOJI[category] : DEFAULT_EMOJI;
}
