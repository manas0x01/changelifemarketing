"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Products, StarterPacks } from '@/entities';

const MOCK_PRODUCTS: Products[] = [
    {
        _id: '1',
        itemName: 'Sea Buckthorn Capsule',
        productNameHindi: 'सी बकथॉर्न कैप्सूल',
        itemImage: '/images/seabuckthorncapsule.png',
        bvValue: 60,
        pvValue: 60,
        keyBenefits: 'Highly beneficial for skin\nImproves digestion\nStrengthens immune system\nBeneficial for heart health\nGood for eye health\nRich in antioxidants and anti-inflammatory properties',
        usageInstructions: 'Take 1 capsule daily in the morning after meals with warm water',
    },
    {
        _id: '2',
        itemName: 'Acidity Drops',
        productNameHindi: 'एसिडिटी ड्रॉप्स',
        itemImage: '/images/aciditydrops.png',
        bvValue: 60,
        pvValue: 60,
        keyBenefits: 'Provides relief from sour belching and chest burning\nHelps reduce gas and bloating\nEffective in indigestion and acidity\nSupports Acid Reflux (GERD) relief\nRelieves nausea and vomiting tendencies\nReduces burning sensation after meals',
        usageInstructions: 'Take 5 drops on an empty stomach, three times a day with a glass of warm water',
    },
    {
        _id: '3',
        itemName: 'Multi Vitamin Capsule',
        productNameHindi: 'मल्टी विटामिन कैप्सूल',
        itemImage: '/images/multivitamincapsule.png',
        bvValue: 60,
        pvValue: 60,
        keyBenefits: 'Helps reduce weakness and fatigue\nStrengthens the immune system\nBeneficial for hair health\nSupports healthy skin\nHelps in strengthening bones\nGood for heart health and memory',
        usageInstructions: 'Take 1 capsule daily in the morning after meals with warm water',
    },
    {
        _id: '4',
        itemName: 'Giloy Drops',
        productNameHindi: 'गिलोय ड्रॉप्स',
        itemImage: '/images/giloydrops.png',
        bvValue: 60,
        pvValue: 60,
        keyBenefits: 'Acts as a blood purifier\nImproves digestion and helps relieve gas and constipation\nBeneficial in fever management\nSupports blood sugar control\nHelps reduce inflammation and body pain\nDetoxifies the body',
        usageInstructions: 'Take 5 drops on an empty stomach in the morning and evening with a glass of warm water',
    },
];

const MOCK_STARTER_PACKS: StarterPacks[] = [
    {
        _id: '1',
        itemName: 'Starter Product Pack No.01',
        itemPrice: 1299,
        itemImage: '/images/starterpack1.png',
        itemDescription: 'Starter pack for beginners\nNo joining fee required\nIncome based on product sales only\nSimple and easy earning model',
        totalBV: 100,
        totalPV: 100,
        binaryIncomeInfo: '1 Pair = ₹1000 (Gross)\nNet payout up to ₹800\nIncome depends on individual effort and team performance\nTerms & conditions apply',
    },
    {
        _id: '2',
        itemName: 'Starter Product Pack No.02',
        itemPrice: 1299,
        itemImage: '/images/starterpack2.png',
        itemDescription: 'Advanced starter pack for better earning\nNo joining fee required\nIncome based on product sales only\nSimple and scalable earning model',
        totalBV: 160,
        totalPV: 160,
        binaryIncomeInfo: '1 Pair (80 PV + 80 PV)\nNet payout up to ₹800\nIncome depends on individual effort and team performance\nTerms & conditions apply',
    }
];

export default function ProductsPage() {
    const [products, setProducts] = useState<Products[]>([]);
    const [starterPacks, setStarterPacks] = useState<StarterPacks[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isLoadingPacks, setIsLoadingPacks] = useState(true);
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
        loadStarterPacks();
    }, []);

    const loadProducts = async () => {
        try {
            setProducts(MOCK_PRODUCTS);
        } catch (error) {
            console.error('Error loading products:', error);
            setProducts(MOCK_PRODUCTS);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const loadStarterPacks = async () => {
        try {
            setStarterPacks(MOCK_STARTER_PACKS);
        } catch (error) {
            console.error('Error loading starter packs:', error);
            setStarterPacks(MOCK_STARTER_PACKS);
        } finally {
            setIsLoadingPacks(false);
        }
    };

    const faqItems = [
        {
            id: '1',
            question: 'Are these products 100% natural?',
            answer: 'Yes, all our products are made from natural ingredients without any harmful chemicals or artificial additives. We maintain the highest quality standards.'
        },
        {
            id: '2',
            question: 'What is the difference between BV and PV?',
            answer: 'BV (Business Volume) is used to calculate commissions, while PV (Personal Volume) represents the retail value of products. Both are important for your earning potential.'
        },
        {
            id: '3',
            question: 'How long does delivery usually take?',
            answer: 'Orders are typically delivered within 3-5 business days. We ensure safe packaging and timely delivery to your doorstep.'
        },
        {
            id: '4',
            question: 'Can I return a product if I am not satisfied?',
            answer: 'Yes, we offer a 30-day money-back guarantee on all products if you are not completely satisfied.'
        },
        {
            id: '5',
            question: 'Are there any side effects?',
            answer: 'Our products are formulated with natural ingredients and are generally safe. However, if you have specific health conditions, consult your healthcare provider before use.'
        },
        {
            id: '6',
            question: 'How do I start earning through starter packs?',
            answer: 'Purchase a starter pack, build your network, and earn from product sales and team commissions. No additional fees required - simple and transparent earning model.'
        }
    ];

    return (
        <div className="min-h-screen bg-[#FFFFFF]">
            <Header />

            {/* Hero Section */}
            <section className="bg-[#0A6E5A] py-16 md:py-20 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="font-['Fraunces'] text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#FFFFFF] mb-4">
                            Natural Health Products
                        </h1>
                        <p className="font-['Roboto'] text-base sm:text-lg md:text-xl text-[#FFFFFF] max-w-3xl mx-auto px-4">
                            Premium quality natural products for a healthier lifestyle
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Products Section */}
            <section className="py-16 md:py-24 bg-[#FFFFFF]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="font-['Fraunces'] text-2xl sm:text-3xl md:text-4xl text-[#0A6E5A] mb-2">
                            All Products
                        </h2>
                        <p className="font-['Roboto'] text-base sm:text-lg text-[#333333]">Explore our complete range of natural health solutions</p>
                        <div className="w-20 h-1 bg-[#C9A84C] mx-auto mt-4"></div>
                    </motion.div>
                    <div className="min-h-100">
                        {isLoadingProducts ? null : products.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
                            >
                                {products.map((product) => (
                                    <motion.div
                                        key={product._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className="bg-[#FFFFFF] border-2 border-[#0A6E5A] rounded-lg overflow-hidden hover:shadow-2xl transition-shadow flex flex-col h-full"
                                    >
                                        <div className="bg-[#0A6E5A] p-3 sm:p-4 text-center">
                                            <h3 className="font-['Fraunces'] text-base sm:text-lg md:text-xl text-[#C9A84C] mb-1">{product.itemName}</h3>
                                            <p className="font-['Roboto'] text-xs sm:text-sm text-[#FFFFFF]">{product.productNameHindi}</p>
                                        </div>

                                        <div className="p-3 sm:p-4 flex flex-col flex-1">
                                            <Image
                                                src={product.itemImage || ''}
                                                alt={product.itemName || 'Product'}
                                                className="w-full h-40 sm:h-48 object-contain rounded-lg mb-3 sm:mb-4"
                                                width={300}
                                                height={300}
                                                style={{ aspectRatio: '1/1' }}
                                            />

                                            <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                                                <span className="font-['Fraunces'] text-sm md:text-base text-[#C9A84C]"></span>
                                                <div className="flex gap-2">
                                                    <span className="bg-[#0A6E5A] text-[#FFFFFF] px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-['Roboto'] font-semibold">
                                                        {product.bvValue} BV
                                                    </span>
                                                    <span className="bg-[#C9A84C] text-[#FFFFFF] px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-['Roboto'] font-semibold">
                                                        {product.pvValue} PV
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-3 sm:mb-4">
                                                <h4 className="font-['Fraunces'] text-sm sm:text-base text-[#0A6E5A] mb-2">Key Benefits:</h4>
                                                <p className="font-['Roboto'] text-xs sm:text-sm text-[#333333] whitespace-pre-line line-clamp-3">
                                                    {product.keyBenefits}
                                                </p>
                                            </div>

                                            <div className="mb-3 sm:mb-4 flex-1">
                                                <h4 className="font-['Fraunces'] text-sm sm:text-base text-[#0A6E5A] mb-2">Usage Instructions:</h4>
                                                <p className="font-['Roboto'] text-xs sm:text-sm text-[#333333]">
                                                    {product.usageInstructions}
                                                </p>
                                            </div>

                                            <button className="w-full bg-[#C9A84C] text-[#FFFFFF] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-['Roboto'] font-semibold hover:bg-[#F5A623] transition-colors flex items-center justify-center gap-2 mt-auto text-sm sm:text-base">
                                                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <section className="py-16 md:py-24 bg-[#0A6E5A]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="font-['Fraunces'] text-2xl sm:text-3xl md:text-4xl text-[#FFFFFF] mb-4">
                            Starter Product Packs
                        </h2>
                        <p className="font-['Roboto'] text-base sm:text-lg text-[#FFFFFF]">
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
                                className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto"
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
                                        <div className="bg-[#C9A84C] p-4 sm:p-6 text-center">
                                            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-[#FFFFFF] mx-auto mb-3" />
                                            <h3 className="font-['Fraunces'] text-lg sm:text-2xl text-[#FFFFFF] mb-2">{pack.itemName}</h3>
                                            <p className="font-['Fraunces'] text-2xl sm:text-3xl text-[#FFFFFF]">₹{pack.itemPrice}</p>
                                        </div>

                                        <div className="p-4 sm:p-6 md:p-8">
                                            <Image
                                                src={pack.itemImage || ''}
                                                alt={pack.itemName || 'Starter Pack'}
                                                className="w-full h-48 sm:h-56 md:h-64 object-contain rounded-lg mb-4 sm:mb-6"
                                                width={400}
                                                height={300}
                                                style={{ aspectRatio: '4/3' }}
                                            />

                                            <div className="mb-4 sm:mb-6">
                                                <h4 className="font-['Fraunces'] text-lg sm:text-xl text-[#0A6E5A] mb-3">Pack Includes:</h4>
                                                <p className="font-['Roboto'] text-sm sm:text-base text-[#333333] whitespace-pre-line">
                                                    {pack.itemDescription}
                                                </p>
                                            </div>

                                            <div className="bg-[#0A6E5A] p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="text-center">
                                                        <p className="font-['Roboto'] text-xs sm:text-sm text-[#FFFFFF] mb-1">Total BV</p>
                                                        <p className="font-['Fraunces'] text-xl sm:text-2xl text-[#C9A84C]">{pack.totalBV}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-['Roboto'] text-xs sm:text-sm text-[#FFFFFF] mb-1">Total PV</p>
                                                        <p className="font-['Fraunces'] text-xl sm:text-2xl text-[#C9A84C]">{pack.totalPV}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-[#FFFFFF] border-2 border-[#C9A84C] p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
                                                <h4 className="font-['Fraunces'] text-lg sm:text-xl text-[#0A6E5A] mb-3">Binary Income Info:</h4>
                                                <p className="font-['Roboto'] text-sm sm:text-base text-[#333333] whitespace-pre-line mb-4">
                                                    {pack.binaryIncomeInfo}
                                                </p>
                                                <p className="font-['Roboto'] text-xs sm:text-sm text-[#333333] italic">
                                                    * Income based on product sales only. No joining fee charged.
                                                </p>
                                            </div>

                                            <button className="w-full bg-[#C9A84C] text-[#FFFFFF] px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-['Roboto'] font-semibold text-base sm:text-lg hover:bg-[#F5A623] transition-colors">
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

{/* Why Choose Our Products Section */}
            <section className="py-16 md:py-24 bg-[#FFFFFF]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="font-['Fraunces'] text-2xl sm:text-3xl md:text-4xl text-[#0A6E5A] mb-4">
                            Why Choose Our Products?
                        </h2>
                        <div className="w-20 h-1 bg-[#C9A84C] mx-auto"></div>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {[
                            { icon: '✓', title: '100% Natural', description: 'Made from pure natural ingredients with no artificial additives' },
                            { icon: '✓', title: 'Certified Quality', description: 'All products are tested and certified for safety and efficacy' },
                            { icon: '✓', title: 'Affordable Prices', description: 'High quality products at competitive and fair prices' },
                            { icon: '✓', title: 'Fast Delivery', description: 'Quick and reliable delivery to your doorstep' },
                            { icon: '✓', title: 'Money Back Guarantee', description: '30-day satisfaction guarantee on all products' },
                            { icon: '✓', title: 'Expert Support', description: '24/7 customer support for all your queries' }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-linear-to-br from-[#0A6E5A] to-[#084d42] p-6 md:p-8 rounded-lg text-center text-white hover:shadow-lg transition-shadow"
                            >
                                <div className="text-4xl mb-4 text-[#C9A84C]">{item.icon}</div>
                                <h3 className="font-['Fraunces'] text-lg md:text-xl mb-3">{item.title}</h3>
                                <p className="font-['Roboto'] text-sm md:text-base text-gray-200">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* FAQ Section */}
            <section className="py-16 md:py-24 bg-[#FFFFFF]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="font-['Fraunces'] text-2xl sm:text-3xl md:text-4xl text-[#0A6E5A] mb-2">
                            Frequently Asked Questions
                        </h2>
                        <p className="font-['Roboto'] text-base sm:text-lg text-[#333333]">Find answers to common questions about our products and services</p>
                        <div className="w-20 h-1 bg-[#C9A84C] mx-auto mt-4"></div>
                    </motion.div>

                    <div className="space-y-4">
                        {faqItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="border-2 border-[#0A6E5A] rounded-lg overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                                    className="w-full bg-[#0A6E5A] text-white p-4 sm:p-6 flex justify-between items-center hover:bg-[#084d42] transition-colors"
                                >
                                    <span className="font-['Fraunces'] text-base sm:text-lg text-left">{item.question}</span>
                                    <div className="ml-4 shrink-0">
                                        {expandedFAQ === item.id ? (
                                            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A84C]" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A84C]" />
                                        )}
                                    </div>
                                </button>

                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{
                                        height: expandedFAQ === item.id ? 'auto' : 0,
                                        opacity: expandedFAQ === item.id ? 1 : 0
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-[#f8f8f8] p-4 sm:p-6 border-t-2 border-[#0A6E5A]">
                                        <p className="font-['Roboto'] text-sm sm:text-base text-[#333333] leading-relaxed">
                                            {item.answer}
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="mt-12 md:mt-16 text-center bg-linear-to-r from-[#0A6E5A] to-[#084d42] p-6 sm:p-8 md:p-10 rounded-lg"
                    >
                        <h3 className="font-['Fraunces'] text-lg sm:text-xl md:text-2xl text-white mb-3">Can't find your answer?</h3>
                        <p className="font-['Roboto'] text-sm sm:text-base text-gray-200 mb-6">
                            Our customer support team is here to help you 24/7
                        </p>
                        <button className="bg-[#C9A84C] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-['Roboto'] font-semibold hover:bg-[#F5A623] transition-colors text-sm sm:text-base">
                            Contact Support
                        </button>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}