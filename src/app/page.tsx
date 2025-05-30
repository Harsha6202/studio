// src/app/page.tsx
"use client"; // Required for useAuth hook

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ScreenShare, Edit3, Share2, Zap, LogOut, UserCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { auth } from '@/lib/firebase/client'; // Import auth for signOut
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


const features = [
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: 'Interactive Tour Creation',
    description: 'Easily build step-by-step product tours using your images or screenshots.',
  },
  {
    icon: <ScreenShare className="h-8 w-8 text-primary" />,
    title: 'Screen Recorder (Soon)',
    description: 'In-app screen recording to capture product workflows directly.',
  },
  {
    icon: <Edit3 className="h-8 w-8 text-primary" />,
    title: 'Visual Editor',
    description: 'Intuitive drag-and-drop interface to reorder steps and edit annotations.',
  },
  {
    icon: <Share2 className="h-8 w-8 text-primary" />,
    title: 'Flexible Publishing',
    description: 'Publish demos publicly with a shareable link or keep them private.',
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Descriptions',
    description: 'Enhance your tour descriptions with AI-suggested wording and tone.',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/'); // Redirect to home page after logout
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: (error as Error).message });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-4 md:px-8 border-b border-border">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-auto" />
          </Link>
          <nav className="space-x-4">
            {loading ? (
              <>
                <Button variant="ghost" disabled>Loading...</Button>
                <Button disabled className="bg-accent hover:bg-accent/90 text-accent-foreground">Loading...</Button>
              </>
            ) : user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">
                    <UserCircle className="mr-2 h-5 w-5" /> Dashboard
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center bg-gradient-to-br from-background to-card">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Create <span className="text-primary">Interactive</span> Product Demos, Effortlessly.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              StoryFlow helps you build engaging, step-by-step product tours that captivate your audience and drive adoption.
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
              <Link href={user ? "/dashboard" : "/signup"}>Start Building Your Tour</Link>
            </Button>
            <div className="mt-16">
               <Image 
                src="https://placehold.co/1200x600.png" 
                alt="StoryFlow App Showcase" 
                width={1200} 
                height={600}
                className="rounded-lg shadow-2xl mx-auto"
                data-ai-hint="product interface"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4">Why StoryFlow?</h2>
            <p className="text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Unlock the power of interactive storytelling for your product.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-card hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4 text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-base text-muted-foreground">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Tell Your Product's Story?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join StoryFlow today and transform how users experience your product.
            </p>
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6">
              <Link href={user ? "/dashboard" : "/signup"}>Create Your First Demo Free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} StoryFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
