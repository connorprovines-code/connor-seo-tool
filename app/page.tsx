import { Search, TrendingUp, Link2, BarChart3, Zap, Target } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: Search,
      title: 'Keyword Research',
      description: 'Discover high-value keywords with multi-source data from DataForSEO Labs, Google Ads, and SERP insights.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      title: 'Rank Tracking',
      description: 'Monitor your search rankings in real-time with detailed competitor analysis and SERP position tracking.',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Link2,
      title: 'Backlink Analysis',
      description: 'Track your backlink profile, discover new opportunities, and analyze competitor link strategies.',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      icon: Target,
      title: 'Competitor Insights',
      description: 'Identify who ranks for your target keywords and discover their strategies to stay ahead.',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  const stats = [
    { value: '100K+', label: 'Keywords Tracked' },
    { value: '99.9%', label: 'Uptime' },
    { value: 'Real-time', label: 'Data Updates' },
    { value: '24/7', label: 'Monitoring' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Powered by DataForSEO & AI
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Dominate Search Rankings
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              With Intelligent SEO
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Comprehensive SEO management platform with advanced rank tracking, multi-source keyword research,
            backlink monitoring, and AI-powered insights—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/register"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              Get Started Free
              <Zap className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            </a>
            <a
              href="/login"
              className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Rank Higher
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed to help you outrank competitors and grow organic traffic
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex p-4 rounded-xl ${feature.bg} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Boost Your Rankings?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of marketers using intelligent SEO tools to dominate search results
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
          >
            Start Free Trial
            <BarChart3 className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
