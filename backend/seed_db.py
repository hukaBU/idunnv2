#!/usr/bin/env python3
"""Database seeding script for Idunn Wellness Products"""

import sys
sys.path.append('/app/backend')

from database import SessionLocal, init_db
from models import Product
import uuid

def seed_products():
    """Seed the database with wellness products"""
    
    # Initialize database tables
    init_db()
    
    db = SessionLocal()
    
    try:
        # Clear existing products
        db.query(Product).delete()
        
        products = [
            # SLEEP Category
            Product(
                name="Magnesium Bisglycinate",
                short_description="Premium magnesium for deep, restorative sleep",
                description="Magnesium Bisglycinate is the gold standard for sleep support. This highly bioavailable form helps calm the nervous system, supports muscle relaxation, and promotes deep REM sleep without morning grogginess. We chose this specific form because it's gentle on digestion and delivers results you can feel from night one.",
                category="sleep",
                price=24.99,
                image_url="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80",
                partner_url="https://example.com/magnesium-bisglycinate",
                is_vetted=1
            ),
            Product(
                name="Organic Chamomile Tea Blend",
                short_description="Soothing herbal blend for evening relaxation",
                description="Our carefully curated chamomile blend combines organic chamomile flowers with lavender and passionflower for the ultimate bedtime ritual. This caffeine-free blend has been used for centuries to promote relaxation and prepare the body for restful sleep. Each ingredient is sourced from organic farms and tested for purity.",
                category="sleep",
                price="14.99",
                image_url="https://images.unsplash.com/photo-1597318493328-76629e0c4a39?w=500&q=80",
                partner_url="https://example.com/chamomile-tea",
                is_vetted=1
            ),
            Product(
                name="Weighted Silk Sleep Mask",
                short_description="Luxurious blackout mask for uninterrupted sleep",
                description="Experience total darkness with this premium weighted silk sleep mask. The gentle pressure provides a calming effect while the 100% mulberry silk is breathable and hypoallergenic. Perfect for travelers, shift workers, or anyone who values quality sleep in any environment.",
                category="sleep",
                price=39.99,
                image_url="https://images.unsplash.com/photo-1633696878086-2b69e5a37da4?w=500&q=80",
                partner_url="https://example.com/sleep-mask",
                is_vetted=1
            ),
            
            # ENERGY Category
            Product(
                name="Vitamin D3 + K2 Complex",
                short_description="Sunshine vitamin for energy and immunity",
                description="This synergistic combination of Vitamin D3 (5000 IU) and K2 (MK-7) supports energy production, immune function, and bone health. D3 is essential for mood and vitality, while K2 ensures proper calcium utilization. We selected this dosage based on the latest research for optimal wellness benefits.",
                category="energy",
                price=29.99,
                image_url="https://images.unsplash.com/photo-1550572017-4f0d6dff8c05?w=500&q=80",
                partner_url="https://example.com/vitamin-d3-k2",
                is_vetted=1
            ),
            Product(
                name="Organic Matcha Powder",
                short_description="Premium Japanese matcha for sustained energy",
                description="Ceremonial grade organic matcha from Uji, Japan. Unlike coffee, matcha provides 4-6 hours of clean, sustained energy thanks to L-theanine, which promotes calm focus without the jitters. Rich in antioxidants, this vibrant green powder supports metabolism and mental clarity throughout your day.",
                category="energy",
                price=34.99,
                image_url="https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=500&q=80",
                partner_url="https://example.com/matcha-powder",
                is_vetted=1
            ),
            Product(
                name="B-Complex with Methylfolate",
                short_description="Bioavailable B vitamins for energy metabolism",
                description="Our comprehensive B-Complex features methylated forms for superior absorption, especially important for individuals with MTHFR gene variations. B vitamins are essential for converting food into cellular energy, supporting nervous system health, and maintaining mental clarity during demanding days.",
                category="energy",
                price=26.99,
                image_url="https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80",
                partner_url="https://example.com/b-complex",
                is_vetted=1
            ),
            
            # SKIN Category
            Product(
                name="Collagen Peptides Serum",
                short_description="Marine collagen for youthful, radiant skin",
                description="This lightweight serum delivers bioactive marine collagen peptides directly to your skin. Clinical studies show visible improvements in skin elasticity, hydration, and fine lines within 4-8 weeks. We use sustainably sourced marine collagen for its smaller molecular size and superior absorption compared to bovine alternatives.",
                category="skin",
                price=49.99,
                image_url="https://images.unsplash.com/photo-1620916297892-272f5d68e3a4?w=500&q=80",
                partner_url="https://example.com/collagen-serum",
                is_vetted=1
            ),
            Product(
                name="Vitamin C Brightening Powder",
                short_description="Pure L-ascorbic acid for glowing complexion",
                description="Freshly activated vitamin C at its most potent. This pharmaceutical-grade L-ascorbic acid powder is mixed with your favorite serum or moisturizer for maximum efficacy. Vitamin C is the gold standard for brightening, protecting against environmental damage, and stimulating collagen production. Powder form ensures stability and potency.",
                category="skin",
                price=32.99,
                image_url="https://images.unsplash.com/photo-1556228852-80e90bb362bc?w=500&q=80",
                partner_url="https://example.com/vitamin-c-powder",
                is_vetted=1
            ),
            Product(
                name="Hyaluronic Acid Complex",
                short_description="Multi-weight hydration for plump skin",
                description="This advanced formula combines three molecular weights of hyaluronic acid to hydrate all skin layers. Low molecular weight penetrates deeply while high molecular weight creates a moisture-locking barrier on the surface. The result is visibly plumper, dewier skin that holds hydration for 24+ hours.",
                category="skin",
                price=27.99,
                image_url="https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=500&q=80",
                partner_url="https://example.com/hyaluronic-acid",
                is_vetted=1
            ),
            
            # FITNESS Category
            Product(
                name="Organic Meditation Cushion",
                short_description="Ergonomic zafu for comfortable practice",
                description="Hand-crafted meditation cushion filled with organic buckwheat hulls for perfect support during sitting practice. The crescent shape promotes proper spinal alignment while the removable cover is machine washable. Whether you're new to meditation or a seasoned practitioner, proper support enhances focus and comfort.",
                category="fitness",
                price=54.99,
                image_url="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=500&q=80",
                partner_url="https://example.com/meditation-cushion",
                is_vetted=1
            ),
            Product(
                name="Cork Yoga Blocks (Set of 2)",
                short_description="Sustainable, sturdy support for your practice",
                description="Made from sustainably harvested cork, these blocks provide stable support for yoga poses while being naturally antimicrobial and moisture-resistant. The firm yet forgiving surface improves form, prevents injury, and helps you access poses safely. Perfect for practitioners of all levels seeking to deepen their practice.",
                category="fitness",
                price=36.99,
                image_url="https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80",
                partner_url="https://example.com/yoga-blocks",
                is_vetted=1
            ),
            Product(
                name="Plant-Based Protein Powder",
                short_description="Complete amino acid profile for recovery",
                description="Our organic blend combines pea, brown rice, and pumpkin seed proteins for a complete amino acid profile that rivals whey. Enhanced with digestive enzymes and naturally sweetened with monk fruit. Each serving delivers 25g of clean protein to support muscle recovery, satiety, and overall wellness goals.",
                category="fitness",
                price=44.99,
                image_url="https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&q=80",
                partner_url="https://example.com/protein-powder",
                is_vetted=1
            ),
            Product(
                name="Resistance Band Set",
                short_description="Versatile bands for strength training anywhere",
                description="This 5-band set (5-50 lbs resistance) includes door anchor, handles, and ankle straps for a complete home gym. Made from natural latex for durability and consistent resistance. Whether you're traveling, at home, or supplementing gym workouts, these bands enable full-body strength training and rehabilitation exercises.",
                category="fitness",
                price=29.99,
                image_url="https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500&q=80",
                partner_url="https://example.com/resistance-bands",
                is_vetted=1
            ),
            Product(
                name="Foam Roller with Trigger Points",
                short_description="Deep tissue massage for muscle recovery",
                description="This high-density foam roller features strategically placed trigger points that mimic the hands of a massage therapist. Perfect for myofascial release, improving flexibility, and accelerating recovery after workouts. The durable EVA foam maintains its shape through thousands of uses while the textured surface penetrates deep into muscle tissue.",
                category="fitness",
                price=38.99,
                image_url="https://images.unsplash.com/photo-1611016186353-7e307b1a01df?w=500&q=80",
                partner_url="https://example.com/foam-roller",
                is_vetted=1
            ),
        ]
        
        # Add all products to database
        for product in products:
            db.add(product)
        
        db.commit()
        print(f"✅ Successfully seeded {len(products)} products!")
        
        # Print summary by category
        categories = db.query(Product.category).distinct().all()
        print("\n📊 Products by category:")
        for (category,) in categories:
            count = db.query(Product).filter(Product.category == category).count()
            print(f"   {category.capitalize()}: {count} products")
            
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding Idunn Wellness Products...\n")
    seed_products()
    print("\n✨ Database seeding complete!")
