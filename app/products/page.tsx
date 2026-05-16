"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Package } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Products, StarterPacks } from '@/entities';

const MOCK_PRODUCTS: Products[] = [
  {
    _id: '1',
    itemName: 'Sea Buckthorn Capsule',
    productNameHindi: 'सी बकथॉर्न कैप्सूल',
    itemPrice: 0,
    itemImage: '/images/seabuckthorncapsule.png',
    bvValue: 700,
    pvValue: 700,
    keyBenefits:
      'Highly beneficial for skin\nImproves digestion\nStrengthens immune system\nBeneficial for heart health\nGood for eye health\nRich in antioxidants and anti-inflammatory properties',
    usageInstructions: 'Take 1 capsule daily in the morning after meals with warm water',
  },
  {
    _id: '2',
    itemName: 'Acidity Drops',
    productNameHindi: 'एसिडिटी ड्रॉप्स',
    itemPrice: 0,
    itemImage: '/images/aciditydrops.png',
    bvValue: 300,
    pvValue: 300,
    keyBenefits:
      'Provides relief from sour belching and chest burning\nHelps reduce gas and bloating\nEffective in indigestion and acidity\nSupports Acid Reflux (GERD) relief\nRelieves nausea and vomiting tendencies\nReduces burning sensation after meals',
    usageInstructions: 'Take 5 drops on an empty stomach, three times a day with a glass of warm water',
  },
  {
    _id: '3',
    itemName: 'Multi Vitamin Capsule',
    productNameHindi: 'मल्टी विटामिन कैप्सूल',
    itemPrice: 0,
    itemImage: '/images/multivitamincapsule.png',
    bvValue: 700,
    pvValue: 700,
    keyBenefits:
      'Helps reduce weakness and fatigue\nStrengthens the immune system\nBeneficial for hair health\nSupports healthy skin\nHelps in strengthening bones\nGood for heart health and memory',
    usageInstructions: 'Take 1 capsule daily in the morning after meals with warm water',
  },
  {
    _id: '4',
    itemName: 'Giloy Drops',
    productNameHindi: 'गिलोय ड्रॉप्स',
    itemPrice: 0,
    itemImage: '/images/giloydrops.png',
    bvValue: 300,
    pvValue: 300,
    keyBenefits:
      'Acts as a blood purifier\nImproves digestion and helps relieve gas and constipation\nBeneficial in fever management\nSupports blood sugar control\nHelps reduce inflammation and body pain\nDetoxifies the body',
    usageInstructions: 'Take 5 drops on an empty stomach in the morning and evening with a glass of warm water',
  },
];

const MOCK_STARTER_PACKS: StarterPacks[] = [
  {
    _id: '1',
    itemName: 'Starter Product Pack No.01',
    itemPrice: 1299,
    itemImage: '/images/pack 1.jpeg',
    itemDescription:
      'Starter pack for beginners\nNo joining fee required\nIncome based on product sales only\nSimple and easy earning model',
    totalBV: 1000,
    totalPV: 1000,
    binaryIncomeInfo:
      '1 Pair (700 BV + 300 BV)\nNet payout up to ₹800\nIncome depends on individual effort and team performance\nTerms & conditions apply',
  },
  {
    _id: '2',
    itemName: 'Starter Product Pack No.02',
    itemPrice: 1299,
    itemImage: '/images/pack 2.jpeg',
    itemDescription:
      'Advanced starter pack for better earning\nNo joining fee required\nIncome based on product sales only\nSimple and scalable earning model',
    totalBV: 1000,
    totalPV: 1000,
    binaryIncomeInfo:
      '1 Pair (700 BV + 300 BV)\nNet payout up to ₹800\nIncome depends on individual effort and team performance\nTerms & conditions apply',
  },
];

export default function ProductsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Products[]>([]);
  const [starterPacks, setStarterPacks] = useState<StarterPacks[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);

  useEffect(() => {
    loadProducts();
    loadStarterPacks();
  }, []);

  const loadProducts = async () => {
    try {
      setProducts(MOCK_PRODUCTS);
    } catch {
      setProducts(MOCK_PRODUCTS);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadStarterPacks = async () => {
    try {
      setStarterPacks(MOCK_STARTER_PACKS);
    } catch {
      setStarterPacks(MOCK_STARTER_PACKS);
    } finally {
      setIsLoadingPacks(false);
    }
  };

  // ── Navigate to /checkout with item details as URL params ──
  const handleOrderNow = (product: Products) => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    const params = new URLSearchParams({
      itemId: product._id,
      itemName: product.itemName || '',
      itemPrice: String(product.itemPrice || 0),
      orderType: 'product',
      bvValue: String(product.bvValue || ''),
      pvValue: String(product.pvValue || ''),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const handleChoosePack = (pack: StarterPacks) => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    const params = new URLSearchParams({
      itemId: pack._id,
      itemName: pack.itemName || '',
      itemPrice: String(pack.itemPrice || 0),
      orderType: 'pack',
      bvValue: String(pack.totalBV || ''),
      pvValue: String(pack.totalPV || ''),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Header />

      {/* Hero Section */}
      <section className="bg-[#0A6E5A] py-20">
        <div className="max-w-400 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-['Fraunces'] text-[2.25rem] md:text-[3.75rem] text-[#FFFFFF] mb-4">
              Natural Health Products
            </h1>
            <p className="font-['Roboto'] text-[1.125rem] text-[#FFFFFF] max-w-3xl mx-auto">
              Premium quality natural products for a healthier lifestyle
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-400 mx-auto px-6">
          <div className="min-h-100">
            {isLoadingProducts ? null : products.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                {products.map((product) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-[#FFFFFF] border-2 border-[#0A6E5A] rounded-lg overflow-hidden hover:shadow-2xl transition-shadow"
                  >
                    <div className="bg-[#0A6E5A] p-4 text-center">
                      <h3 className="font-['Fraunces'] text-[1.25rem] text-[#C9A84C] mb-1">{product.itemName}</h3>
                      <p className="font-['Roboto'] text-[0.875rem] text-[#FFFFFF]">{product.productNameHindi}</p>
                    </div>

                    <div className="p-4">
                      <Image
                        src={product.itemImage || ''}
                        alt={product.itemName || 'Product'}
                        className="w-full h-48 object-contain rounded-lg mb-4"
                        width={300}
                        height={200}
                      />

                      <div className="flex justify-end items-center mb-4">
                        {/* Pricing removed as per request */}
                        <div className="flex gap-2">
                          <span className="bg-[#0A6E5A] text-[#FFFFFF] px-3 py-1 rounded text-[0.875rem] font-['Roboto'] font-semibold">
                            {product.bvValue} BV
                          </span>
                          <span className="bg-[#C9A84C] text-[#FFFFFF] px-3 py-1 rounded text-[0.875rem] font-['Roboto'] font-semibold">
                            {product.pvValue} PV
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-['Fraunces'] text-[1.125rem] text-[#0A6E5A] mb-2">Key Benefits:</h4>
                        <p className="font-['Roboto'] text-[0.875rem] text-[#333333] whitespace-pre-line">
                          {product.keyBenefits}
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-['Fraunces'] text-[1.125rem] text-[#0A6E5A] mb-2">Usage Instructions:</h4>
                        <p className="font-['Roboto'] text-[0.875rem] text-[#333333]">{product.usageInstructions}</p>
                      </div>

                      <button
                        onClick={() => handleOrderNow(product)}
                        className="w-full bg-[#C9A84C] text-[#FFFFFF] px-6 py-3 rounded-lg font-['Roboto'] font-semibold hover:bg-[#F5A623] transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Order Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Starter Packs Section */}
      <section className="py-20 bg-[#0A6E5A]">
        <div className="max-w-400 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-['Fraunces'] text-[2.25rem] md:text-[3rem] text-[#FFFFFF] mb-4">
              Starter Product Packs
            </h2>
            <p className="font-['Roboto'] text-[1.125rem] text-[#FFFFFF]">
              Choose your perfect starter pack and begin your journey
            </p>
          </motion.div>

          <div className="min-h-100">
            {isLoadingPacks ? null : starterPacks.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
              >
                {starterPacks.map((pack, index) => (
                  <motion.div
                    key={pack._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#FFFFFF] rounded-lg overflow-hidden border-4 border-[#C9A84C]"
                  >
                    <div className="bg-[#C9A84C] p-6 text-center">
                      <Package className="w-12 h-12 text-[#FFFFFF] mx-auto mb-3" />
                      <h3 className="font-['Fraunces'] text-[1.875rem] text-[#FFFFFF] mb-2">{pack.itemName}</h3>
                      {/* Pricing removed as per request */}
                    </div>

                    <div className="p-8">
                      <Image
                        src={pack.itemImage || ''}
                        alt={pack.itemName || 'Starter Pack'}
                        className="w-full h-64 object-contain rounded-lg mb-6"
                        width={400}
                        height={300}
                      />

                      <div className="mb-6">
                        <h4 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A] mb-3">Pack Includes:</h4>
                        <p className="font-['Roboto'] text-[#333333] whitespace-pre-line">{pack.itemDescription}</p>
                      </div>

                      <div className="bg-[#0A6E5A] p-6 rounded-lg mb-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <p className="font-['Roboto'] text-[0.875rem] text-[#FFFFFF] mb-1">Total BV</p>
                            <p className="font-['Fraunces'] text-[1.875rem] text-[#C9A84C]">{pack.totalBV}</p>
                          </div>
                          <div className="text-center">
                            <p className="font-['Roboto'] text-[0.875rem] text-[#FFFFFF] mb-1">Total PV</p>
                            <p className="font-['Fraunces'] text-[1.875rem] text-[#C9A84C]">{pack.totalPV}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#FFFFFF] border-2 border-[#C9A84C] p-6 rounded-lg mb-6">
                        <h4 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A] mb-3">Binary Income Info:</h4>
                        <p className="font-['Roboto'] text-[#333333] whitespace-pre-line mb-4">
                          {pack.binaryIncomeInfo}
                        </p>
                        <p className="font-['Roboto'] text-[0.875rem] text-[#333333] italic">
                          * Income based on product sales only. No joining fee charged.
                        </p>
                      </div>

                      <button
                        onClick={() => handleChoosePack(pack)}
                        className="w-full bg-[#C9A84C] text-[#FFFFFF] px-6 py-4 rounded-lg font-['Roboto'] font-semibold text-[1.125rem] hover:bg-[#F5A623] transition-colors"
                      >
                        Choose This Pack
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Coming Soon Products Section */}
      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-400 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-['Fraunces'] text-[2.25rem] md:text-[3rem] text-[#0A6E5A] mb-2">Coming Soon</h2>
            <p className="font-['Roboto'] text-[1.125rem] text-[#333333]/70">Exciting new products launching soon</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-lg shadow-lg"
            >
              <Image
                src="/images/productcomingsoon.jpeg"
                alt="Coming Soon Products"
                className="w-full h-auto object-cover rounded-lg"
                width={600}
                height={500}
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0A6E5A]/40 to-transparent rounded-lg"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h3 className="font-['Fraunces'] text-[2rem] md:text-[2.5rem] text-[#0A6E5A] mb-4">
                  New Products Launching
                </h3>
                <p className="font-['Roboto'] text-[1rem] text-[#333333]/70 mb-6">
                  We're excited to announce the arrival of premium wellness products designed specifically for your
                  health and well-being. Stay tuned for an exclusive launch event!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Nari Shakti Capsule',
                    desc: "Natural wellness formula for women's health and vitality",
                    delay: 0.1,
                  },
                  {
                    name: 'Nari Suraksha Ultra Thin Sanitary Pads',
                    desc: 'Premium comfort and protection for active women',
                    delay: 0.2,
                  },
                ].map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: item.delay }}
                    className="bg-[#0A6E5A]/5 border-2 border-[#C9A84C] rounded-lg p-6 hover:bg-[#C9A84C]/10 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <span className="bg-[#C9A84C] text-[#FFFFFF] px-3 py-1 rounded-full text-[0.75rem] font-['Roboto'] font-bold whitespace-nowrap mt-1">
                        Coming Soon
                      </span>
                    </div>
                    <h4 className="font-['Fraunces'] text-[1.125rem] text-[#0A6E5A]">{item.name}</h4>
                    <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/60 mt-2">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-[#C9A84C] hover:bg-[#B8952F] text-[#FFFFFF] px-8 py-4 rounded-lg font-['Roboto'] font-semibold text-[1.125rem] transition-colors w-full md:w-auto"
              >
                Notify Me When Available
              </motion.button>

              <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/50 italic">
                * Products will be available for pre-order soon. Subscribe to our newsletter for updates.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}