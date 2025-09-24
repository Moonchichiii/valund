import { type JSX, useCallback, useState } from 'react';
import { CheckCircle, Clock, Filter, MapPin, Search, Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input as _Input } from '@/shared/components/ui/Input';
import { Card, CardContent, CardFooter } from '@/shared/components/ui/Card';

export const FindTalent = (): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'frontend', name: 'Frontend Development' },
    { id: 'backend', name: 'Backend Development' },
    { id: 'design', name: 'UX/UI Design' },
    { id: 'mobile', name: 'Mobile Development' },
    { id: 'data', name: 'Data Science' },
  ];

  const professionals = [
    {
      id: 1,
      name: "Erik Andersson",
      title: "Senior Frontend Developer",
      location: "Stockholm, Sweden",
      avatar: "EA",
      rating: 4.9,
      reviews: 47,
      rate: "€85/hour",
      skills: ["React", "TypeScript", "Next.js", "Node.js"],
      status: "available",
      description: "Specialized in React, TypeScript, and modern web technologies. 8+ years crafting scalable applications for Nordic enterprises.",
      accent: "bg-accent-blue",
      category: "frontend"
    },
    {
      id: 2,
      name: "Astrid Hansen",
      title: "UX/UI Designer",
      location: "Copenhagen, Denmark",
      avatar: "AH",
      rating: 4.8,
      reviews: 32,
      rate: "€70/hour",
      skills: ["Figma", "Design Systems", "User Research", "Prototyping"],
      status: "busy",
      description: "Expert in user experience design and design systems. Collaborates closely with development teams.",
      accent: "bg-accent-warm",
      category: "design"
    },
    {
      id: 3,
      name: "Nils Larsson",
      title: "Full Stack Developer",
      location: "Oslo, Norway",
      avatar: "NL",
      rating: 4.7,
      reviews: 28,
      rate: "€90/hour",
      skills: ["Python", "Django", "PostgreSQL", "AWS"],
      status: "available",
      description: "Full-stack developer with expertise in Python and cloud architecture. Building robust applications for 6+ years.",
      accent: "bg-accent-green",
      category: "backend"
    },
    {
      id: 4,
      name: "Emilia Virtanen",
      title: "Mobile Developer",
      location: "Helsinki, Finland",
      avatar: "EV",
      rating: 4.9,
      reviews: 41,
      rate: "€80/hour",
      skills: ["React Native", "Swift", "Kotlin", "Firebase"],
      status: "available",
      description: "Mobile app developer specializing in cross-platform solutions. Created 50+ apps with millions of downloads.",
      accent: "bg-accent-blue",
      category: "mobile"
    }
  ];

  const filteredProfessionals = professionals.filter(pro => {
    const matchesSearch = pro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pro.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pro.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || pro.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Event handlers wrapped in useCallback for performance
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedCategory(e.target.value);
  }, []);

  return (
    <div className="min-h-screen bg-nordic-cream py-12">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-text-primary mb-4 tracking-tight">Find Nordic Talent</h1>
          <p className="text-xl text-text-secondary max-w-2xl">
            Discover exceptional professionals across the Nordic countries who are ready to bring your projects to life.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-12">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, skill, or expertise..."
                className="w-full pl-12 pr-4 py-4 border border-border-medium rounded-nordic-lg focus:outline-none focus:border-accent-primary transition-colors bg-nordic-cream"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[200px]">
              <label htmlFor="category-filter" className="sr-only">Filter by category</label>
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
              <select
                id="category-filter"
                className="w-full pl-12 pr-4 py-4 border border-border-medium rounded-nordic-lg focus:outline-none focus:border-accent-primary appearance-none bg-nordic-cream"
                value={selectedCategory}
                onChange={handleCategoryChange}
                aria-label="Filter by category"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-text-secondary">
            Found <span className="font-medium text-text-primary">{filteredProfessionals.length}</span> professionals
          </p>
        </div>

        {/* Professionals Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {filteredProfessionals.map((pro) => (
            <Card key={pro.id} hover="lift">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-nordic-lg flex items-center justify-center text-white font-semibold text-lg ${pro.accent}`}>
                    {pro.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-1">{pro.name}</h3>
                    <p className="text-text-secondary font-medium">{pro.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-text-secondary">{pro.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pro.status === 'available' ? (
                    <CheckCircle className="w-5 h-5 text-accent-green" />
                  ) : (
                    <Clock className="w-5 h-5 text-accent-warm" />
                  )}
                </div>
              </div>

              {/* Description */}
              <CardContent>
                <p className="text-text-secondary leading-relaxed mb-6">{pro.description}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {pro.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-nordic-warm text-text-secondary text-sm rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent-warm text-accent-warm" />
                    <span className="text-sm font-medium text-text-secondary">{pro.rating}</span>
                    <span className="text-sm text-text-muted">({pro.reviews} reviews)</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">{pro.rate}</span>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${pro.status === 'available' ? 'bg-accent-green' : 'bg-accent-warm'}`} />
                    <span className="text-sm text-text-secondary">
                      {pro.status === 'available' ? 'Available now' : 'Available March 2025'}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button variant="ghost">View Profile</Button>
                <Button className="flex-1">Contact</Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredProfessionals.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-text-primary mb-2">No professionals found</h3>
            <p className="text-text-secondary">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};
