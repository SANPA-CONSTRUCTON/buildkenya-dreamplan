import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { Home, Target, Users, Lightbulb, Mail, Phone, MapPin } from "lucide-react";

const About = () => {
  const services = [
    {
      icon: Target,
      title: "Budget-to-Plan Recommendations",
      description: "Get realistic house designs that match your exact budget with accurate Kenyan construction costs."
    },
    {
      icon: Home,
      title: "Accurate Kenyan Cost Breakdowns",
      description: "Detailed cost analysis based on current 2024-2025 market rates across different regions in Kenya."
    },
    {
      icon: Lightbulb,
      title: "AI House Visualization Prompts",
      description: "Ready-to-use AI prompts for generating photorealistic images of your future home design."
    },
    {
      icon: Users,
      title: "Step-by-Step Building Journey",
      description: "Complete construction timeline with permits, inspections, and expert tips for building in Kenya."
    }
  ];

  return (
    <AppLayout 
      title="About BuildMyDream"
      description="Learn about our mission to make home planning simple, transparent, and achievable for Kenyans through AI-powered tools and accurate cost analysis."
    >
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full">
              <Home className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About BuildMyDream
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We make home planning simple, transparent, and achievable for Kenyans by combining 
            real construction data with powerful AI visualization tools.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 bg-gradient-card border-0 shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Every Kenyan deserves to build their dream home with confidence. We provide the tools, 
                insights, and guidance needed to turn housing dreams into achievable plans. By leveraging 
                AI technology and real market data, we eliminate guesswork and empower informed decision-making 
                in the construction journey.
              </p>
              <div className="flex justify-center">
                <Badge variant="secondary" className="text-lg px-6 py-2">
                  🇰🇪 Proudly Kenyan
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="h-full hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <service.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Vision Section */}
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Our Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                "A Kenya where every dream home begins with a plan you can trust."
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We envision a future where access to accurate construction planning is not a privilege 
                but a right. Through technology and transparency, we're building a platform that 
                democratizes home planning and makes quality housing accessible to all Kenyans.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Get In Touch</CardTitle>
            <p className="text-muted-foreground">
              Ready to start planning your dream home? We're here to help.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Email Us</h4>
                  <p className="text-muted-foreground">info@buildmydream.co.ke</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Call Us</h4>
                  <p className="text-muted-foreground">+254 7XX XXX XXX</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Visit Us</h4>
                  <p className="text-muted-foreground">Nairobi, Kenya</p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button variant="hero" size="lg">
                Start Planning Your Dream Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default About;