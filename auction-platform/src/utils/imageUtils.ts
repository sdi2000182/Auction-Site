// Default placeholder images using picsum for different auction categories
// Using different seed numbers to get variety in images
const DEFAULT_IMAGES = {
  electronics: 'https://picsum.photos/400/300?random=101',
  clothing: 'https://picsum.photos/400/300?random=102',
  home: 'https://picsum.photos/400/300?random=103',
  sports: 'https://picsum.photos/400/300?random=104',
  books: 'https://picsum.photos/400/300?random=105',
  automotive: 'https://picsum.photos/400/300?random=106',
  collectibles: 'https://picsum.photos/400/300?random=107',
  art: 'https://picsum.photos/400/300?random=108',
  jewelry: 'https://picsum.photos/400/300?random=109',
  musical: 'https://picsum.photos/400/300?random=110',
  default: 'https://picsum.photos/400/300?random=100'
};

// Category mapping to determine which default image to use
const CATEGORY_MAPPING: Record<string, keyof typeof DEFAULT_IMAGES> = {
  'electronics': 'electronics',
  'electronic devices and gadgets': 'electronics',
  'clothing & accessories': 'clothing',
  'fashion items and accessories': 'clothing',
  'home & garden': 'home',
  'home improvement and garden items': 'home',
  'housewares & kitchenware': 'home',
  'sports & outdoors': 'sports',
  'sports equipment and outdoor gear': 'sports',
  'books & media': 'books',
  'books, movies, music and media': 'books',
  'automotive': 'automotive',
  'car parts and automotive accessories': 'automotive',
  'collectibles': 'collectibles',
  'collectible items and antiques': 'collectibles',
  'art & crafts': 'art',
  'art supplies and handmade items': 'art',
  'jewelry': 'jewelry',
  'watches': 'jewelry',
  'music': 'musical',
  'musical instruments': 'musical',
  'records': 'musical',
  'classical': 'musical'
};

/**
 * Gets the appropriate image URL for an auction item
 * Returns the first available image or a category-appropriate default
 */
export const getAuctionImage = (images: string[], categories: Array<{name: string; id: number}>, auctionId?: number): string => {
  // If we have images, return the first one
  if (images && images.length > 0) {
    return images[0];
  }

  // No images - determine appropriate default based on category
  if (categories && categories.length > 0) {
    const categoryName = categories[0].name.toLowerCase();

    // Try to find a matching category
    for (const [key, imageKey] of Object.entries(CATEGORY_MAPPING)) {
      if (categoryName.includes(key.toLowerCase())) {
        // Use auction ID as seed for unique images
        const seed = auctionId ? auctionId * 10 + 1 : Math.floor(Math.random() * 1000);
        return `https://picsum.photos/400/300?random=${seed}`;
      }
    }
  }

  // Fallback to default image with auction ID seed
  const seed = auctionId ? auctionId * 10 + 1 : Math.floor(Math.random() * 1000);
  return `https://picsum.photos/400/300?random=${seed}`;
};

/**
 * Gets multiple default images for variety in carousel/gallery views
 */
export const getDefaultImages = (categories: Array<{name: string; id: number}>, count: number = 3, auctionId?: number): string[] => {
  // Generate unique images for each position using auction ID as base
  const images: string[] = [];

  for (let i = 0; i < count; i++) {
    const seed = auctionId ? auctionId * 10 + (i + 1) : Math.floor(Math.random() * 1000) + i;
    images.push(`https://picsum.photos/400/300?random=${seed}`);
  }

  return images;
};

/**
 * Gets exactly 3 unique images for an auction based on its ID
 * If real images exist, fills the remainder with generated ones
 */
export const getAuctionImages = (images: string[], categories: Array<{name: string; id: number}>, auctionId: number): string[] => {
  const result: string[] = [];

  // Add real images first (up to 3)
  if (images && images.length > 0) {
    result.push(...images.slice(0, 3));
  }

  // Fill remaining slots with generated images
  const needed = 3 - result.length;
  if (needed > 0) {
    for (let i = 0; i < needed; i++) {
      const seed = auctionId * 10 + (result.length + i + 1);
      result.push(`https://picsum.photos/400/300?random=${seed}`);
    }
  }

  return result;
};

export default DEFAULT_IMAGES;