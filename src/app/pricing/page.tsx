import { Check, X } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
    const plans = [
        {
            name: 'Free',
            price: '0',
            description: 'Perfect for getting started',
            features: [
                'Create basic CV',
                'Apply to 5 jobs per month',
                'Basic profile',
                'Email support',
            ],
            limitations: [
                'No priority support',
                'Limited applications',
                'No advanced features',
            ],
            cta: 'Get Started',
            href: '/register',
            popular: false,
        },
        {
            name: 'Professional',
            price: '29',
            description: 'For serious job seekers',
            features: [
                'Advanced CV builder',
                'Unlimited applications',
                'Priority listing',
                'Profile verification',
                'Advanced analytics',
                'Priority support',
            ],
            limitations: [],
            cta: 'Start Free Trial',
            href: '/register',
            popular: true,
        },
        {
            name: 'Clinic',
            price: '99',
            description: 'For dental clinics',
            features: [
                'Post unlimited jobs',
                'Access to all candidates',
                'Advanced search filters',
                'Applicant tracking',
                'Team collaboration',
                'Dedicated support',
                'Custom branding',
            ],
            limitations: [],
            cta: 'Contact Sales',
            href: '/contact',
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container-custom max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Choose the plan that&apos;s right for you
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20 px-4">
                <div className="container-custom max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-transform hover:scale-105 ${plan.popular
                                        ? 'border-blue-500'
                                        : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {plan.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        {plan.description}
                                    </p>
                                    <div className="mb-6">
                                        <span className="text-5xl font-bold text-gray-900 dark:text-white">
                                            ${plan.price}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-400">/month</span>
                                    </div>
                                    <Link
                                        href={plan.href}
                                        className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${plan.popular
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                    <div className="mt-8 space-y-4">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-start gap-3">
                                                <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                                                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                        {plan.limitations.map((limitation) => (
                                            <div key={limitation} className="flex items-start gap-3">
                                                <X className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                                                <span className="text-gray-400 dark:text-gray-500">{limitation}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-4 bg-white dark:bg-gray-800">
                <div className="container-custom max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Can I change my plan later?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Is there a free trial?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Yes, we offer a 14-day free trial for the Professional plan. No credit card required.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                What payment methods do you accept?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                We accept all major credit cards, PayPal, and bank transfers for annual plans.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
