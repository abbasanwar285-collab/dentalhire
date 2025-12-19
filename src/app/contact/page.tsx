'use client';

import { useState } from 'react';
import { Mail, Phone, Send } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ContactPage() {
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log('Form submitted:', formData);
        alert(language === 'ar' ? 'شكراً لرسالتك! سنتواصل معك قريباً.' : 'Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container-custom max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('contact.title')}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        {t('contact.subtitle')}
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section className="pb-20 px-4">
                <div className="container-custom max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {t('contact.form.title')}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('contact.name')}
                                    </label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={t('contact.name.placeholder')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('contact.email')}
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder={t('contact.email.placeholder')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('contact.subject')}
                                    </label>
                                    <Input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder={t('contact.subject.placeholder')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('contact.message')}
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder={t('contact.message.placeholder')}
                                        rows={5}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <Button type="submit" className="w-full" leftIcon={<Send size={18} />}>
                                    {t('contact.send')}
                                </Button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    {t('contact.info.title')}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-8">
                                    {t('contact.info.subtitle')}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Mail className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('auth.email')}</h3>
                                        <p className="text-gray-600 dark:text-gray-300">abbasanwar285@gmail.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Phone className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('contact.phone')}</h3>
                                        <p className="text-gray-600 dark:text-gray-300">07810988380</p>
                                        <p className="text-gray-600 dark:text-gray-300">{language === 'ar' ? 'الإثنين-الجمعة، 9ص-6م' : 'Mon-Fri, 9am-6pm EST'}</p>
                                    </div>
                                </div>


                            </div>

                            <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl p-8 text-white mt-8">
                                <h3 className="text-xl font-bold mb-2">{t('contact.help')}</h3>
                                <p className="mb-4">{t('contact.help.desc')}</p>
                                <a href="/pricing#faq" className="text-white underline hover:no-underline">
                                    {t('contact.faq')} →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

