'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
          message: formData.message,
          submissionDate: new Date().toISOString(),
          from_name: formData.fullName,
          from_email: formData.email,
          subject: `New Contact Inquiry from ${formData.fullName}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setFormData({
          fullName: '',
          mobileNumber: '',
          email: '',
          message: '',
        });

        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        console.error('Web3Form submission failed:', data);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="bg-primary py-20">
        <div className="max-w-400 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Mail className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="font-heading text-4xl md:text-6xl text-white-card-background mb-4">
              Contact Us
            </h1>
            <p className="font-paragraph text-lg text-white-card-background max-w-3xl mx-auto">
              Get in touch with us for any inquiries or support
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content Section */}
      <section className="py-20 bg-white-card-background">
        <div className="max-w-400 mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-heading text-3xl text-primary mb-6">Get In Touch</h2>
                <p className="font-paragraph text-lg text-black mb-8">
                  We're here to help and answer any questions you might have. We look forward to hearing from you!
                </p>
              </div>

              {/* Address */}
              <div className="bg-primary p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-secondary mb-2">Head Office</h3>
                    <p className="font-paragraph text-white-card-background">
                      Ward No. 21, Holding No. 120<br />
                      Dak Bangla Road, Masaurhi<br />
                      Patna, Bihar - 804452
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-primary p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-secondary mb-2">Phone</h3>
                    <p className="font-paragraph text-white-card-background">
                      +91 6204720770<br />
                      Mon - Sat: 9:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-primary p-6 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-secondary mb-2">Email</h3>
                    <p className="font-paragraph text-white-card-background">
                      info@changelifemarketing.in<br />
                      support@changelifemarketing.in
                    </p>
                  </div>
                </div>
              </div>

              {/* Website */}
              <div className="bg-secondary p-6 rounded-lg">
                <h3 className="font-heading text-xl text-secondary-foreground mb-2">Website</h3>
                <p className="font-paragraph text-secondary-foreground">
                  www.changelifemarketing.com
                </p>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="font-heading text-2xl text-primary mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-6 h-6 text-primary-foreground" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-6 h-6 text-primary-foreground" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-6 h-6 text-primary-foreground" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-6 h-6 text-primary-foreground" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white-card-background border-4 border-primary rounded-lg p-8">
                <h2 className="font-heading text-3xl text-primary mb-6">Send Us a Message</h2>

                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary p-4 rounded-lg mb-6 text-center"
                  >
                    <p className="font-paragraph text-secondary-foreground font-semibold">
                      Thank you! Your message has been sent successfully.
                    </p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block font-paragraph font-semibold text-black mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      suppressHydrationWarning={true}
                      className="w-full px-4 py-3 border-2 text-gray-700 border-primary rounded-lg font-paragraph focus:outline-none focus:border-secondary"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block font-paragraph font-semibold text-black mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      required
                      suppressHydrationWarning={true}
                      className="w-full px-4 py-3  text-gray-700 border-2 border-primary rounded-lg font-paragraph focus:outline-none focus:border-secondary"
                      placeholder="Enter your mobile number"
                    />
                  </div>

                  <div>
                    <label className="block font-paragraph font-semibold text-black mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      suppressHydrationWarning={true}
                      className="w-full px-4 py-3 border-2 text-gray-700 border-primary rounded-lg font-paragraph focus:outline-none focus:border-secondary"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block font-paragraph font-semibold text-black mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      suppressHydrationWarning={true}
                      className="w-full px-4 py-3 border-2 border-primary text-gray-700 rounded-lg font-paragraph focus:outline-none focus:border-secondary"
                      placeholder="Write your message here..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-secondary text-gray-700 px-8 py-4 rounded-lg font-paragraph font-semibold text-lg hover:bg-gold-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Google Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12"
          >
            <h2 className="font-heading text-3xl text-primary mb-6 text-center">Find Us on Map</h2>
            <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden border-4 border-primary">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3597.8!2d85.13506!3d25.59412!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f6e0d5f5f5f5f5%3A0x5f5f5f5f5f5f5f5f!2sWard%20No.%2021%2C%20Masaurhi%2C%20Patna%2C%20Bihar%20804452!5e0!3m2!1sen!2sin!4v1704067200"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Change Life Marketing Location - Patna, Bihar"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
